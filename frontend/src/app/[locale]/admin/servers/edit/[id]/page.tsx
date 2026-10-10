import { redirect } from "next/navigation";

// The edit server flow now uses a sidebar drawer on /admin/servers.
// This page redirects back there so any existing links don't 404.
export default function EditServerPage() {
  redirect('/admin/servers');
}
