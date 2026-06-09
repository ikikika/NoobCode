import io
import json
import time
import contextlib


def __run_harness():
    user_code = __user_code__  # noqa: F821 - injected by worker
    fn_name = __function_name__  # noqa: F821 - injected by worker
    tests = json.loads(__tests_json__)  # noqa: F821 - injected by worker
    kind = __kind__  # noqa: F821 - injected by worker ('function' | 'design')
    io_spec = json.loads(__io_json__)  # noqa: F821 - injected by worker

    def normalize(value):
        # Make results JSON-comparable: tuples -> lists, sets -> sorted lists.
        if isinstance(value, tuple):
            return [normalize(v) for v in value]
        if isinstance(value, list):
            return [normalize(v) for v in value]
        if isinstance(value, set):
            return sorted(normalize(v) for v in value)
        if isinstance(value, dict):
            return {k: normalize(v) for k, v in value.items()}
        return value

    # --- Structured-I/O codec (mirrors src/features/runner/io.ts) ---
    class _TreeNode:
        def __init__(self, val):
            self.val = val
            self.left = None
            self.right = None

    class _ListNode:
        def __init__(self, val):
            self.val = val
            self.next = None

    def build_tree(arr):
        if not isinstance(arr, list) or len(arr) == 0 or arr[0] is None:
            return None
        root = _TreeNode(arr[0])
        queue = [root]
        i = 1
        head = 0
        while i < len(arr) and head < len(queue):
            node = queue[head]
            head += 1
            if i < len(arr):
                lv = arr[i]
                i += 1
                if lv is not None:
                    node.left = _TreeNode(lv)
                    queue.append(node.left)
            if i < len(arr):
                rv = arr[i]
                i += 1
                if rv is not None:
                    node.right = _TreeNode(rv)
                    queue.append(node.right)
        return root

    def serialize_tree(root):
        if root is None:
            return []
        out = []
        queue = [root]
        head = 0
        while head < len(queue):
            node = queue[head]
            head += 1
            if node is None:
                out.append(None)
            else:
                out.append(node.val)
                queue.append(node.left)
                queue.append(node.right)
        while out and out[-1] is None:
            out.pop()
        return out

    def build_list(arr):
        if not isinstance(arr, list) or len(arr) == 0:
            return None
        dummy = _ListNode(0)
        tail = dummy
        for v in arr:
            tail.next = _ListNode(v)
            tail = tail.next
        return dummy.next

    def serialize_list(head):
        out = []
        node = head
        seen = set()
        while node is not None and id(node) not in seen:
            seen.add(id(node))
            out.append(node.val)
            node = node.next
        return out

    def decode_arg(value, k):
        if k == "tree":
            return build_tree(value)
        if k == "list":
            return build_list(value)
        return value

    def encode_result(value, k):
        if k == "tree":
            return serialize_tree(value)
        if k == "list":
            return serialize_list(value)
        return value

    arg_kinds = io_spec.get("args") or []
    result_kind = io_spec.get("result")

    namespace = {}
    cases = []

    try:
        exec(user_code, namespace)
    except Exception as exc:  # noqa: BLE001
        return json.dumps({"cases": [], "error": "Error while loading your code: %s" % exc})

    target = namespace.get(fn_name)
    if not callable(target):
        what = "class" if kind == "design" else "function"
        return json.dumps(
            {"cases": [], "error": "Could not find a %s named '%s'." % (what, fn_name)}
        )

    def run_function_case(test):
        args = test.get("args", [])
        decoded = [decode_arg(a, arg_kinds[i] if i < len(arg_kinds) else None) for i, a in enumerate(args)]
        raw = target(*decoded)
        return normalize(encode_result(raw, result_kind))

    def run_design_case(test):
        ops = test.get("ops", [])
        arg_lists = test.get("args", [])
        results = []
        instance = None
        for i, op in enumerate(ops):
            call_args = arg_lists[i] if i < len(arg_lists) else []
            if i == 0:
                instance = target(*call_args)
                results.append(None)
            else:
                method = getattr(instance, op)
                r = method(*call_args)
                results.append(normalize(r))
        return results

    for test in tests:
        expected = test.get("expected")
        buffer = io.StringIO()
        start = time.perf_counter()
        actual = None
        error = None
        passed = False
        try:
            with contextlib.redirect_stdout(buffer):
                actual = run_design_case(test) if kind == "design" else run_function_case(test)
            passed = actual == expected
        except Exception as exc:  # noqa: BLE001
            error = "%s: %s" % (type(exc).__name__, exc)
        duration_ms = (time.perf_counter() - start) * 1000.0

        case = {
            "name": test.get("name", "case"),
            "passed": passed,
            "input": test.get("args", []),
            "expected": expected,
            "actual": actual,
            "stdout": buffer.getvalue(),
            "durationMs": duration_ms,
        }
        if error is not None:
            case["error"] = error
        cases.append(case)

    return json.dumps({"cases": cases})


__harness_result = __run_harness()
__harness_result
