import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";


// 1. THIS LINE MUST BE AT THE VERY TOP to prevent build-time caching
export const dynamic = 'force-dynamic'; 

import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 2. MAKE SURE 'active' IS INCLUDED HERE
  const { data, error } = await supabase
    .from('teachers')
    .select('id, name, active') 
    .eq('active', true);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ teachers: data });
}
}