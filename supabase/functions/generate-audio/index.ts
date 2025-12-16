const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestPayload {
  text: string;
  voiceId: string;
  speed?: number;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  const chunks = [];

  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, i + chunkSize);
    chunks.push(String.fromCharCode(...chunk));
  }

  return btoa(chunks.join(''));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { text, voiceId, speed = 1.0 }: RequestPayload = await req.json();

    if (!text || !voiceId) {
      return new Response(
        JSON.stringify({ error: "Text and voiceId are required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const elevenLabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!elevenLabsApiKey) {
      console.error("ELEVENLABS_API_KEY environment variable not set");
      return new Response(
        JSON.stringify({
          error: "ElevenLabs API key not configured. Please add your API key to the Supabase Edge Function secrets."
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("Generating audio with ElevenLabs...", { textLength: text.length, voiceId, speed });

    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": elevenLabsApiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error("ElevenLabs API error:", {
        status: elevenLabsResponse.status,
        statusText: elevenLabsResponse.statusText,
        error: errorText
      });
      return new Response(
        JSON.stringify({
          error: "Failed to generate audio from ElevenLabs",
          details: errorText
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const audioBlob = await elevenLabsResponse.arrayBuffer();
    console.log("Audio generated successfully, size:", audioBlob.byteLength);

    const base64Audio = arrayBufferToBase64(audioBlob);

    return new Response(
      JSON.stringify({
        audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
        success: true,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in generate-audio function:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
