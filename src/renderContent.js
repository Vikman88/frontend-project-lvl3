const contentPaths = {
  button: () => 'field.posts.button',
  feeds: () => 'field.feeds.header',
  field: () => 'field.posts.header',
};

const createEl = (el) => document.createElement(`${el}`);

const buildModalWindow = (content, el) => {
  const modalTitle = el.modalHead;
  modalTitle.firstChild.textContent = content.title;
  const modalDescription = el.modalBody;
  modalDescription.textContent = content.description;
  const modalLink = el.modalFooter;
  modalLink.querySelector('a').href = content.link;
};

const renderFields = (items, el, i18n, currentId) => items.reduce((acc, item) => {
  const liItems = createEl('li');
  const button = createEl('button');
  button.type = 'button';
  button.classList.add('btn', 'btn-primary', 'btn-sm');
  button.setAttribute('data-toggle', 'modal');
  button.setAttribute('data-target', '#modal');
  button.textContent = i18n.t(contentPaths.button());
  button.setAttribute('data-id', item.id);
  liItems.classList.add(
    'list-group-item',
    'd-flex',
    'justify-content-between',
    'align-items-start',
  );
  const a = createEl('a');
  a.href = item.link;
  if (item.touched) a.classList.add('font-weight-normal');
  else a.classList.add('font-weight-bold');
  if (item.id === parseInt(currentId, 10)) buildModalWindow(item, el);
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.setAttribute('data-id', item.id);
  a.textContent = item.title;
  liItems.append(a, button);
  return [...acc, liItems];
}, []);

const renderContent = (state, el, i18n) => {
  const { posts, currentId } = state;
  el.feedsField.innerHTML = '';
  el.postsField.innerHTML = '';
  const h2Feeds = createEl('h2');
  const h2Posts = createEl('h2');
  h2Feeds.textContent = i18n.t(contentPaths.feeds());
  h2Posts.textContent = i18n.t(contentPaths.field());
  const ulFeeds = createEl('ul');
  const ulPosts = createEl('ul');
  ulFeeds.classList.add('list-group', 'mb-5');
  ulPosts.classList.add('list-group');
  el.feedsField.append(h2Feeds, ulFeeds);
  el.postsField.append(h2Posts, ulPosts);
  posts.forEach((post) => {
    const li = createEl('li');
    li.classList.add('list-group-item');
    const h3 = createEl('h3');
    h3.textContent = post.title;
    const p = createEl('p');
    p.textContent = post.description;
    li.append(h3, p);
    ulFeeds.prepend(li);
    const renderedFields = renderFields(post.items, el, i18n, currentId);
    ulPosts.prepend(...renderedFields);
  });
};

export default renderContent;