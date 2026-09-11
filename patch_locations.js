
const fs = require('fs');
const file = 'backend/src/routes/admin/locations.js';
let code = fs.readFileSync(file, 'utf8');

const target = /router\.put\('\/:id', requireAdmin, async \(req, res\) => \{[\s\S]*?res\.json\(updated\);\n\}\);/g;

const replacement = outer.put('/:id', requireAdmin, async (req, res) => {
    const parsed = schema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    
    const original = await Location.findById(String(req.params.id)).lean();
    if (!original) return res.status(404).json({ error: 'Not found' });

    const updated = await Location.findByIdAndUpdate(String(req.params.id), parsed.data, { new: true }).lean();

    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern('admin:locations');

    const changes = {};
    for (const [k, v] of Object.entries(parsed.data)) {
        if (original[k] !== v) changes[k] = { old: original[k], new: v };
    }

    const { writeAudit } = require('../../middleware/audit');
    await writeAudit(req, 'admin.location.update', 'location', updated._id.toString(), { changes });

    res.json(updated);
});;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);

