import sys

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Plan.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
    content = content.replace(
        "Plan.find().sort({ sortOrder: 1, createdAt: -1 }).lean()",
        "Plan.find().populate('category', 'name').sort({ sortOrder: 1, createdAt: -1 }).lean()"
    )
    # let plan = await Plan.findById(String(req.params.id)).lean();
    content = content.replace(
        "Plan.findById(String(req.params.id)).lean()",
        "Plan.findById(String(req.params.id)).populate('category', 'name').lean()"
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

replace_in_file('backend/src/routes/admin/plans.js')
