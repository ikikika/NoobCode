import io
import json
import time
import contextlib


def __run_harness():
    user_code = __user_code__  # noqa: F821 - injected by worker
    fn_name = __function_name__  # noqa: F821 - injected by worker
    tests = json.loads(__tests_json__)  # noqa: F821 - injected by worker

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

    namespace = {}
    cases = []

    try:
        exec(user_code, namespace)
    except Exception as exc:  # noqa: BLE001
        return json.dumps({"cases": [], "error": "Error while loading your code: %s" % exc})

    fn = namespace.get(fn_name)
    if not callable(fn):
        return json.dumps(
            {"cases": [], "error": "Could not find a function named '%s'." % fn_name}
        )

    for test in tests:
        args = test.get("args", [])
        expected = test.get("expected")
        buffer = io.StringIO()
        start = time.perf_counter()
        actual = None
        error = None
        passed = False
        try:
            with contextlib.redirect_stdout(buffer):
                actual = fn(*args)
            actual = normalize(actual)
            passed = actual == expected
        except Exception as exc:  # noqa: BLE001
            error = "%s: %s" % (type(exc).__name__, exc)
        duration_ms = (time.perf_counter() - start) * 1000.0

        case = {
            "name": test.get("name", "case"),
            "passed": passed,
            "input": args,
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
