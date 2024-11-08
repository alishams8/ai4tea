import { supabase } from '../../lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json({
        valid: false,
        message: 'API key is required'
      }, { status: 400 });
    }

    // Validate key format
    const keyPattern = /^AI4TEA_[a-z0-9]+_[A-Za-z0-9]{32}$/;
    if (!keyPattern.test(apiKey)) {
      return NextResponse.json({
        valid: false,
        message: 'Invalid API key format'
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('api_key')
      .select('*')
      .eq('value', apiKey);

    if (error) {
      throw error;
    }

    if (data.length > 0) {
      // Update last_used timestamp
      await supabase
        .from('api_key')
        .update({ last_used: new Date().toISOString() })
        .eq('value', apiKey);
    }

    return NextResponse.json({
      valid: data.length > 0,
      message: data.length > 0 ? 'Valid API key' : 'Invalid API key'
    });
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json({
      valid: false,
      message: 'Error validating key',
      error: error.message
    }, { status: 500 });
  }
}