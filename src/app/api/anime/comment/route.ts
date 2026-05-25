import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

interface CommentBody {
  animeId: string;
  body: string;
  spoiler: boolean;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

function cleanText(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to join the discussion." }, { status: 401 });
  }

  const body = (await request.json()) as Partial<CommentBody>;
  const animeId = cleanText(body.animeId, 80);
  const comment = cleanText(body.body, 2000);

  if (!UUID_RE.test(animeId)) {
    return NextResponse.json(
      { error: "Publish a rating first so this AniList anime can sync to the public catalog." },
      { status: 409 }
    );
  }

  if (!comment) {
    return NextResponse.json({ error: "Write something before posting." }, { status: 400 });
  }

  const writer = getSupabaseAdmin() ?? supabase;
  const { data, error } = await writer
    .from("comments")
    .insert({
      user_id: user.id,
      parent_type: "anime",
      parent_id: animeId,
      body: comment,
      is_spoiler: Boolean(body.spoiler),
      reply_to: null,
    })
    .select("*, profiles(username, display_name, avatar_url, is_verified)")
    .single();

  if (error) {
    return NextResponse.json({ error: "Could not publish that comment yet." }, { status: 500 });
  }

  return NextResponse.json({ comment: data });
}
