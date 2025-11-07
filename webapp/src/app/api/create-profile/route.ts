import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Check if service role key is available
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set');
      return NextResponse.json(
        { error: 'Server configuration error: Missing service role key' },
        { status: 500 }
      );
    }

    if (!supabaseUrl) {
      console.error('NEXT_PUBLIC_SUPABASE_URL is not set');
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase URL' },
        { status: 500 }
      );
    }

    // Create a Supabase admin client with SERVICE ROLE key (bypasses RLS)
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const body = await request.json();
    const { userId, role, employeeId, department, name } = body;

    console.log('Creating profile for user:', userId, 'with role:', role, 'name:', name);

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check for duplicate employee ID
    if (employeeId) {
      const { data: existing } = await supabaseAdmin
        .from('profiles')
        .select('employee_id')
        .eq('employee_id', employeeId)
        .single();

      if (existing) {
        console.error('Duplicate employee ID:', employeeId);
        return NextResponse.json(
          { error: `Employee ID ${employeeId} is already registered` },
          { status: 409 }
        );
      }
    }

    // Insert profile using service role (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        name: name || null,
        role: role || 'USER',
        employee_id: employeeId || null,
        department: department || null,
        camera_consent: false,
        processing_consent: false,
        analytics_consent: false,
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (error) {
      console.error('Profile creation error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log('Profile created successfully:', data);

    return NextResponse.json({ success: true, profile: data });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
