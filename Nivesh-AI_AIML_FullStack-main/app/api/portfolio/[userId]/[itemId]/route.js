import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
  const { userId, itemId } = await params;
  
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    console.log('Removing portfolio item:', { userId, itemId });

    const encodedUserId = encodeURIComponent(userId);
    const response = await fetch(
      `${backendUrl}/api/portfolio/${encodedUserId}/${itemId}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { detail: error || 'Failed to remove item' },
        { status: response.status }
      );
    }

    return NextResponse.json({ message: 'Item removed successfully' });
  } catch (error) {
    console.error('Error in portfolio delete route:', error);
    return NextResponse.json(
      { detail: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}