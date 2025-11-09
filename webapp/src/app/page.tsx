import { redirect } from 'next/navigation'

export default async function Home() {
  // This redirect will now work for both authenticated and unauthenticated users.
  redirect('/landing')
}
