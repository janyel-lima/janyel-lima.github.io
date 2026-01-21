async function includeHTML() {
  const includes = document.querySelectorAll('[data-include]')

  for (const el of includes) {
    const file = el.getAttribute('data-include')
    const res = await fetch(file)

    if (!res.ok) {
      el.innerHTML = `<!-- include error: ${file} -->`
      continue
    }

    el.innerHTML = await res.text()
  }

  // re-render lucide depois de injetar
  if (window.lucide) lucide.createIcons()
}
