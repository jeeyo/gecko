const BASE = "http://localhost:3000/api";

async function test() {
  // 1. Create a note
  const res1 = await fetch(`${BASE}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Initial Title", content: "Initial Content" }),
  });
  const note = await res1.json();
  console.log("Created note:", note);

  // 2. Update the note
  const res2 = await fetch(`${BASE}/notes/${note.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Updated Title" }),
  });
  const updatedNote = await res2.json();
  console.log("Updated note:", updatedNote);

  if (updatedNote.title === "Updated Title") {
    console.log("SUCCESS: Title updated");
  } else {
    console.log("FAILURE: Title not updated");
  }

  // 3. Delete the note
  await fetch(`${BASE}/notes/${note.id}`, { method: "DELETE" });
}

test().catch(console.error);
