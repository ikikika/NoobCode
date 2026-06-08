import ast
import json


def __analyze():
    code = __analyze_code__  # noqa: F821 - injected by the worker
    fn_name = __analyze_fn__  # noqa: F821 - injected by the worker

    features = {
        "maxLoopDepth": 0,
        "usesHashStructure": False,
        "usesSorting": False,
        "usesRecursion": False,
        "twoPointerShape": False,
        "earlyReturn": False,
    }

    try:
        tree = ast.parse(code)
    except SyntaxError:
        return json.dumps(features)

    class Visitor(ast.NodeVisitor):
        def __init__(self):
            self.loop_depth = 0
            self.max_loop_depth = 0
            self.return_count = 0
            # name -> True if assigned 0
            self.zero_assigns = set()
            self.len_minus_one = False

        def _enter_loop(self, node):
            self.loop_depth += 1
            self.max_loop_depth = max(self.max_loop_depth, self.loop_depth)
            self.generic_visit(node)
            self.loop_depth -= 1

        def visit_For(self, node):
            self._enter_loop(node)

        def visit_While(self, node):
            self._enter_loop(node)

        def visit_Return(self, node):
            self.return_count += 1
            self.generic_visit(node)

        def visit_Dict(self, node):
            features["usesHashStructure"] = True
            self.generic_visit(node)

        def visit_Set(self, node):
            features["usesHashStructure"] = True
            self.generic_visit(node)

        def visit_SetComp(self, node):
            features["usesHashStructure"] = True
            self.generic_visit(node)

        def visit_DictComp(self, node):
            features["usesHashStructure"] = True
            self.generic_visit(node)

        def visit_Call(self, node):
            func = node.func
            # dict()/set() builtins
            if isinstance(func, ast.Name):
                if func.id in ("dict", "set"):
                    features["usesHashStructure"] = True
                if func.id in ("sorted",):
                    features["usesSorting"] = True
                if fn_name and func.id == fn_name:
                    features["usesRecursion"] = True
            # x.sort()
            if isinstance(func, ast.Attribute):
                if func.attr == "sort":
                    features["usesSorting"] = True
            self.generic_visit(node)

        def visit_Assign(self, node):
            # Detect left = 0 and right = len(x) - 1
            value = node.value
            if isinstance(value, ast.Constant) and value.value == 0:
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        self.zero_assigns.add(target.id)
            if (
                isinstance(value, ast.BinOp)
                and isinstance(value.op, ast.Sub)
                and isinstance(value.right, ast.Constant)
                and value.right.value == 1
                and isinstance(value.left, ast.Call)
                and isinstance(value.left.func, ast.Name)
                and value.left.func.id == "len"
            ):
                self.len_minus_one = True
            self.generic_visit(node)

    visitor = Visitor()
    visitor.visit(tree)

    features["maxLoopDepth"] = visitor.max_loop_depth
    features["earlyReturn"] = visitor.return_count > 1
    features["twoPointerShape"] = bool(visitor.zero_assigns) and visitor.len_minus_one

    return json.dumps(features)


__result = __analyze()
__result
