import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { userId } = await params;
  
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    const encodedUserId = encodeURIComponent(userId);
    const response = await fetch(`${backendUrl}/api/portfolio/${encodedUserId}`);
    const responseText = await response.text();
    
    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data, { status: response.status });
    } catch (e) {
      console.error('Error parsing response:', e, responseText);
      return NextResponse.json(
        { detail: 'Invalid response from API' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in portfolio GET route:', error);
    return NextResponse.json(
      { detail: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}