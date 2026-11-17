// Responds with an attachment so a full page load to this URL turns into a
// download and the browser stays on the current page.
export function GET() {
  return new Response("download", {
    headers: {
      "Content-Type": "text/plain",
      "Content-Disposition": 'attachment; filename="download.txt"',
    },
  });
}
