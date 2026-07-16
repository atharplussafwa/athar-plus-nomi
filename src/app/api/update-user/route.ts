import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { id, name, role, email, password } = await request.json()

    if (!id) return NextResponse.json({ error: 'معرّف العضو مطلوب' }, { status: 400 })
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
      return NextResponse.json({ error: 'Service role key missing' }, { status: 500 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const authUpdate: any = {}
    if (email) authUpdate.email = email
    if (password) authUpdate.password = password

    if (Object.keys(authUpdate).length > 0) {
      const { error: authError } = await supabase.auth.admin.updateUserById(id, authUpdate)
      if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const profileUpdate: any = {}
    if (name) profileUpdate.name = name
    if (role) profileUpdate.role = role

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await supabase.from('profiles').update(profileUpdate).eq('id', id)
      if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
