import sys

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    content = content.replace(
        'parseFloat(e.target.value) || 0',
        '''e.target.value === '' ? '' : parseFloat(e.target.value)'''
    )
    content = content.replace(
        'parseInt(e.target.value) || 0',
        '''e.target.value === '' ? '' : parseInt(e.target.value)'''
    )
    content = content.replace(
        'parseInt(e.target.value) || 1',
        '''e.target.value === '' ? '' : parseInt(e.target.value)'''
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

replace_in_file('frontend/src/components/admin/plan/PlanEditForm.tsx')
replace_in_file('frontend/src/components/admin/plan/PlanForm.tsx')
