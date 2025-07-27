function getFollowersListContainer() {
  const dialog = document.querySelector('div[role="dialog"]');
  if (!dialog) return null;

  // Busca todas as ULs dentro do modal
  const uls = dialog.querySelectorAll('ul');

  for (let ul of uls) {
    const lis = ul.querySelectorAll('li');
    for (let li of lis) {
      const btn = li.querySelector('button');
      if (btn && /seguir|follow/i.test(btn.innerText.trim())) {
        return ul;
      }
    }
  }

  return null;
}
