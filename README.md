# La selva del perezoso

Diorama en pixel art 3D (Three.js) de la entrevista a la Dra. Elena Uribe en el cuento «Cero»: un perezoso espera frente a una rama vacía y un insecto aterriza justo ahí; un águila arpía baja en picada y, tres segundos antes del impacto, cae una rama podrida y la golpea. El moho que viste al perezoso ve dónde van a estar las cosas (los fantasmas dorados) y solo lo mueve a la coordenada correcta. Dos investigadores observan desde un refugio. Bucle de 90 s.

- `src/` código fuente; `SITE_URL=https://b8a4b6i1.github.io/selva node build.mjs --minify` genera `selva.html` autocontenido (se publica como `index.html`).
- Todo es función pura del tiempo `t` (`src/config.js`, `src/stage.js`); `?t=` congela un instante; `?print=1` quita el cielo y los botones.
- Sonido de 8 bits sintetizado; arranca en silencio (botón abajo a la derecha).
- En celular: arrastrar, pellizcar y doble toque para acercar; sin paneo automático.
