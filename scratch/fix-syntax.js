const fs = require('fs');

const infoRowPath = 'c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile/ui/InfoRow.tsx';
let infoRow = fs.readFileSync(infoRowPath, 'utf8');
infoRow = infoRow.replace(/import \{ Check, Save \} , AlertCircle, Pencil \} from 'lucide-react';/, "import { Check, Save, AlertCircle, Pencil } from 'lucide-react';");
fs.writeFileSync(infoRowPath, infoRow);

const profileFormsPath = 'c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile/ui/ProfileForms.tsx';
let profileForms = fs.readFileSync(profileFormsPath, 'utf8');
profileForms = profileForms.replace(/export function ProfileInfoForm.*const t = useTranslations\('Profile'\); (.*)\{/s, "export function ProfileInfoForm($1{\n  const t = useTranslations('Profile');\n");
// Actually, let's just do an exact replace for the first one since we saw it
profileForms = profileForms.replace("export function ProfileInfoForm({\n  const t = useTranslations('Profile'); form, setForm, saving, onSave }: { form: any; setForm: (f: any) => void; saving: boolean; onSave: () => void }) {", "export function ProfileInfoForm({ form, setForm, saving, onSave }: { form: any; setForm: (f: any) => void; saving: boolean; onSave: () => void }) {\n  const t = useTranslations('Profile');");

profileForms = profileForms.replace("export function EmailChangeForm({\n  const t = useTranslations('Profile'); email, onSubmit, saving }: { email: string; onSubmit: (email: string, password: string) => void; saving: boolean }) {", "export function EmailChangeForm({ email, onSubmit, saving }: { email: string; onSubmit: (email: string, password: string) => void; saving: boolean }) {\n  const t = useTranslations('Profile');");

profileForms = profileForms.replace("export function PasswordChangeForm({\n  const t = useTranslations('Profile'); onSubmit, saving }: { onSubmit: (currentPassword: string, newPassword: string) => void; saving: boolean }) {", "export function PasswordChangeForm({ onSubmit, saving }: { onSubmit: (currentPassword: string, newPassword: string) => void; saving: boolean }) {\n  const t = useTranslations('Profile');");

fs.writeFileSync(profileFormsPath, profileForms);
console.log('Fixed syntax errors');
