const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const apiKey = formData.get("apiKey") as string;

    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: "Audio file is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get OpenAI API key from request or environment
    const openaiApiKey = apiKey ||
                         Deno.env.get("OPENAI_API_KEY") ||
                         Deno.env.get("VITE_OPENAI_API_KEY");

    console.log("API key source:", apiKey ? "from request" : "from environment");
    console.log("API key available:", !!openaiApiKey);

    if (!openaiApiKey) {
      console.error("OpenAI API key not found");
      return new Response(
        JSON.stringify({
          error: "OpenAI API key not configured",
          hint: "API key must be passed in request or set in environment"
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

    console.log("OpenAI API key found, proceeding with transcription");
    console.log("Transcribing audio file:", audioFile.name, "Size:", audioFile.size);

    // Create FormData for OpenAI Whisper API
    const transcriptionFormData = new FormData();
    transcriptionFormData.append("file", audioFile);
    transcriptionFormData.append("model", "whisper-1");

    // Call OpenAI Whisper API
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: transcriptionFormData,
      }
    );

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI API error:", errorText);
      return new Response(
        JSON.stringify({
          error: "Failed to transcribe audio",
          details: errorText,
          status: openaiResponse.status
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

    const transcriptionData = await openaiResponse.json();
    console.log("Transcription successful:", transcriptionData);

    return new Response(
      JSON.stringify({
        transcript: transcriptionData.text || "",
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
    console.error("Error in transcribe-audio function:", error);
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