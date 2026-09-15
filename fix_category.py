import sys

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    content = content.replace('eggCount', 'planCount')
    content = content.replace('/api/admin/eggs/categories', '/api/admin/plans/categories')
    content = content.replace('eggs', 'plans')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

replace_in_file('frontend/src/components/admin/plan/PlanCategorySelect.tsx')
