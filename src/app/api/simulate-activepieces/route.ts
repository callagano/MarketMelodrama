import { NextRequest, NextResponse } from 'next/server';

// Temporary in-memory storage for simulation
let simulatedData: any = null;
let lastSimulationTime: number = 0;

export async function POST(request: NextRequest) {
  try {
    console.log('=== Simulating ActivePieces data ===');
    
    // Create simulated ActivePieces data
    const simulatedActivePiecesData = {
      title: `Simulazione Market Update - ${new Date().toLocaleString('it-IT')}`,
      sentiment: Math.floor(Math.random() * 100),
      highlights: [
        "Mercati mostrano sentiment positivo",
        "Azioni tech in crescita", 
        "Settore energetico volatile",
        "Inflazione sotto controllo"
      ],
      big_picture: [
        "I mercati globali rispondono agli indicatori economici",
        "La fiducia degli investitori rimane alta nonostante le incertezze",
        "Le banche centrali mantengono politiche accomodanti"
      ]
    };

    // Store simulated data
    simulatedData = simulatedActivePiecesData;
    lastSimulationTime = Date.now();

    console.log('Simulated data stored:', simulatedData);

    return NextResponse.json({
      success: true,
      message: 'ActivePieces data simulated successfully',
      data: simulatedActivePiecesData,
      timestamp: new Date().toISOString(),
      note: 'This is simulated data for testing purposes'
    });

  } catch (error) {
    console.error('Error simulating ActivePieces data:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to simulate ActivePieces data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const now = Date.now();
    const minutesSinceLastSimulation = lastSimulationTime > 0 ? 
      Math.round((now - lastSimulationTime) / 1000 / 60) : 0;

    return NextResponse.json({
      success: true,
      message: 'Simulated ActivePieces data retrieved',
      data: simulatedData,
      lastSimulation: lastSimulationTime > 0 ? new Date(lastSimulationTime).toISOString() : null,
      minutesSinceLastSimulation,
      hasData: simulatedData !== null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting simulated data:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get simulated data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
