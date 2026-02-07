
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dwdcbvpgoypfgeeruipe.supabase.co';
const supabaseKey = 'sb_publishable_mQXjuL4fYVZkK1Cwef9Klg_np3TEuiP';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('Testing connection to:', supabaseUrl);
    console.log('Using Key:', supabaseKey);

    // 1. Check Table Access (Read)
    const { data, error } = await supabase.from('vehicles').select('count', { count: 'exact', head: true });

    if (error) {
        console.log('ERROR:', error.message);
        if (error.message.includes('JWT')) {
            console.log('DIAGNOSIS: The sb_publishable key is NOT accepted as a JWT. We need the "anon" JWT key.');
        }
    } else {
        console.log('SUCCESS');
    }
}

test();
