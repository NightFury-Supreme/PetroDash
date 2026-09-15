import sys

def replace_in_file(filepath, is_edit):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add import
    import_str = \"import { PlanCategorySelect } from './PlanCategorySelect';\n\"
    if \"import { PlanCategorySelect }\" not in content:
        content = content.replace(\"import { ChevronDown } from 'lucide-react';\", \"import { ChevronDown } from 'lucide-react';\n\" + import_str)
        content = content.replace(\"import { CustomSelect } from './Shared';\", \"import { CustomSelect } from './Shared';\n\" + import_str)

    val_str = \"plan.category\" if is_edit else \"formData.category\"

    old_code = f\"\"\"<input
              type=\"text\"
              value={{{val_str}}}
              onChange={{(e) => onInputChange('category', e.target.value)}}
              className={{inputClass}}
              placeholder=\"e.g., Gaming\"
            />\"\"\"

    new_code = f\"\"\"<PlanCategorySelect 
              value={{{val_str} || ''}} 
              onChange={{(v) => onInputChange('category', v)}} 
            />\"\"\"

    content = content.replace(old_code, new_code)
    
    # Replace FieldLabel>Category</FieldLabel> with FieldLabel>Category *</FieldLabel>
    # or just add * if not there
    # But wait, it's easier to just find the FieldLabel above old_code? The old_code is replaced.
    content = content.replace(\"<FieldLabel>Category</FieldLabel>\", \"<FieldLabel>Category <span className=\\\"text-red-500\\\">*</span></FieldLabel>\")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

replace_in_file('frontend/src/components/admin/plan/PlanEditForm.tsx', True)
replace_in_file('frontend/src/components/admin/plan/PlanForm.tsx', False)
