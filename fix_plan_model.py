filepath = 'backend/src/models/Plan.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Make description required
content = content.replace("description: {\n    type: String,\n    trim: true\n  },", "description: {\n    type: String,\n    required: true,\n    trim: true\n  },")

# Make category required
content = content.replace("category: { type: mongoose.Schema.Types.ObjectId, ref: 'PlanCategory' },", "category: { type: mongoose.Schema.Types.ObjectId, ref: 'PlanCategory', required: true },")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Plan.js")
