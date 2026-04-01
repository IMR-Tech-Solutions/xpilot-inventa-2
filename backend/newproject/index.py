import os
import ast

# Set this to your project folder
PROJECT_DIR = os.path.abspath(".")

# To store found packages
used_packages = set()

def visit_imports(node):
    if isinstance(node, ast.Import):
        for n in node.names:
            used_packages.add(n.name.split('.')[0])
    elif isinstance(node, ast.ImportFrom):
        if node.module:
            used_packages.add(node.module.split('.')[0])

# Walk through all Python files in your project
for root, dirs, files in os.walk(PROJECT_DIR):
    # Skip virtual environments and migrations
    if 'venv' in dirs:
        dirs.remove('venv')
    if '__pycache__' in dirs:
        dirs.remove('__pycache__')

    for file in files:
        if file.endswith(".py"):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    tree = ast.parse(f.read(), filename=file)
                    for node in ast.walk(tree):
                        visit_imports(node)
            except Exception as e:
                print(f"Skipped {filepath}: {e}")

# Print the list of used packages
print("\nPackages used in this project:\n")
for pkg in sorted(used_packages):
    print(pkg)
