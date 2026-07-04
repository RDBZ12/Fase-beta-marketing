const apiKey = "AQ.Ab8RN6I3m-L7smSfGxiubp81o6Jdna-1ZxnzBqvBa30tQprIYw";
fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
.then(r => r.json()).then(data => console.log(data.models.map(m => m.name))).catch(console.error);
