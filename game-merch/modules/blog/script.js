const posts = [
  {
    id: 1,
    title: 'Lea Plushie',
    author: 'He haw',
    date: 'July 18, 2026',
    summary: 'Shes a plushie',
    thumbnail: 'LeaPlush.webp',
    content: '<p>Shes a plushie. Buy her.</p>',
    comments: [
      { author: 'MADNKALD', text: 'Smug for what.' },
      { author: 'Mandanman', text: 'I hate it here.' }
    ]
  },
  {
  id: 2,
  title: 'Sir a second post has hit the website',
  author: 'Lee man Lee',
  date: 'July 2077, 2026',
  summary: 'According to all known law of aviation.',
  thumbnail: 'https://www.fangamer.com/cdn/shop/products/product_HK_hornet_plush_main_55c63d68-e558-4387-9b7d-d3d030627658.png?crop=center&height=600&v=1691698061&width=900',
  content: '<p>According to all law of aviation there is no way a bee should be able to fly. </p>',
  comments: [
    { author: 'SilkDaughter', text: 'Do you guys know she make a ridiculous face when her back is against the wall.' },
    { author: 'FixerFlick', text: '#watdatmean.' }
  ]
}
];

const postList = document.getElementById('postList');

function renderPosts() {
  if (!postList) return;

  postList.innerHTML = posts.map((post, index) => {
    const commentsHtml = post.comments.map(comment => `
      <li><strong>${comment.author}</strong><p>${comment.text}</p></li>
    `).join('');

    return `
      <details class="post-dropdown" ${index === 0 ? 'open' : ''}>
        <summary class="post-summary">
          <img src="${post.thumbnail}" alt="${post.title}" class="post-thumbnail" />
          <div class="post-summary-body">
            <h3>${post.title}</h3>
            <p class="post-date">${post.date}</p>
            <p>${post.summary}</p>
          </div>
        </summary>
        <div class="post-expanded">
          <div class="post-content">
            <p class="detail-meta">By ${post.author} • ${post.date}</p>
            ${post.content}
          </div>
          <section class="comments-section">
            <h4>Comments</h4>
            <ul>${commentsHtml}</ul>
          </section>
        </div>
      </details>
    `;
  }).join('');
}



renderPosts();  