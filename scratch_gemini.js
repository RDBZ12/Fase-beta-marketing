const apiKey = "AQ.Ab8RN6I3m-L7smSfGxiubp81o6Jdna-1ZxnzBqvBa30tQprIYw";
fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: "Hello" }] }]
  })
}).then(r => r.json()).then(console.log).catch(console.error);
