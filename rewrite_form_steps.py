filepath = 'frontend/src/components/admin/plan/PlanForm.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Update props
content = content.replace('interface PlanFormProps {\n  formData: PlanFormData;', 'interface PlanFormProps {\n  formData: PlanFormData;\n  currentStep?: string;')
content = content.replace('export function PlanForm({\n  formData,\n  validationErrors,\n  saving,\n  onInputChange,\n  onSubmit,\n}: PlanFormProps) {', 'export function PlanForm({\n  formData,\n  validationErrors,\n  saving,\n  onInputChange,\n  onSubmit,\n  currentStep,\n}: PlanFormProps) {')

# Instead of space-y-6, make it space-y-0 since we render one step at a time
content = content.replace('className="space-y-6">', 'className="space-y-0">')

# Wrap Basic Info
content = content.replace('      {/* Basic Info */}\n      <div className="space-y-4">', '      {/* Basic Info */}\n      {(!currentStep || currentStep === "basics") && (\n      <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">')

# Close Basic Info and hide <hr>
content = content.replace('        </div>\n      </div>\n\n      <hr className="border-white/[0.06]" />\n\n      {/* Pricing */}', '        </div>\n      </div>\n      )}\n\n      {/* Pricing */}')

# Wrap Pricing
content = content.replace('      {/* Pricing */}\n      <div className="space-y-4">', '      {/* Pricing */}\n      {(!currentStep || currentStep === "pricing") && (\n      <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">')

# Close Pricing and hide <hr>
content = content.replace('        </div>\n      </div>\n\n      <hr className="border-white/[0.06]" />\n\n      {/* Resource Limits */}', '        </div>\n      </div>\n      )}\n\n      {/* Resource Limits */}')

# Wrap Resource Limits
content = content.replace('      {/* Resource Limits */}\n      <div className="space-y-4">', '      {/* Resource Limits */}\n      {(!currentStep || currentStep === "resources") && (\n      <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">')

# Close Resource Limits
content = content.replace('        </div>\n      </div>\n\n    </form>', '        </div>\n      </div>\n      )}\n\n    </form>')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated PlanForm.tsx")
