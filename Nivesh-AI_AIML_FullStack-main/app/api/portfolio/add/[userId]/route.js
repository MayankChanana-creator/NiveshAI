import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  const { userId } = await params;
  
  try {
    const body = await request.json();
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    console.log('Received request to add portfolio item:', { userId, body });

    const encodedUserId = encodeURIComponent(userId);
    const apiUrl = `${backendUrl}/api/portfolio/add/${encodedUserId}`;
    console.log('Calling FastAPI endpoint:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    console.log('FastAPI response:', response.status, responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('Error parsing response:', e);
      return NextResponse.json(
        { detail: 'Invalid response from API' },
        { status: 500 }
      );
    }

    return NextResponse.json(responseData, { status: response.status });
  } catch (error) {
    console.error('Error in portfolio add API route:', error);
    return NextResponse.json(
      { detail: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}