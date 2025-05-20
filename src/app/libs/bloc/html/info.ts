export const presentation = (lang: string = "all") => {
  const pt = `
	<section id="projectDescription" aria-labelledby="projectTitle" class="mb-4">
		<details class="content-section" open>
			<summary>
				<h4 class="section-heading">🎯 Objetivo Principal</h3>
			</summary>
			<p class="mb-4">
				O <b class="project-name">LLM Prompt Purify</b> tem como <em class="primary-goal">objetivo principal</em> oferecer uma ferramenta automatizada para o mascaramento de dados sensíveis (incluindo informações pessoais, corporativas, financeiras, entre outras) em textos, empregando exclusivamente <mark class="highlight">JavaScript no lado do cliente</mark>, a fim de proteger os usuários contra eventuais vazamentos de dados.
			</p>
		</details>
	
		<details class="content-section">
			<summary>
				<h4 class="section-heading">🔍 Casos Estudados</h3>
			</summary>
			<p class="mb-4">
				O foco dos mascaramentos — isto é, o que fundamenta nossas abordagens de processamento textual — concentra-se nos textos utilizados para a elaboração de prompts direcionados aos <abbr class="abbr-term" title="Grandes Modelos de Linguagem">LLMs</abbr>, que atualmente dominam o campo da <abbr class="abbr-term" title="Inteligência Artificial">IA</abbr>.
			</p>
		</details>
	
		<details class="content-section">
			<summary>
				<h4 class="section-heading">🖥️ Integração Técnica</h3>
			</summary>
			<p class="mb-4">
				Diversos especialistas já constataram que tais modelos estão integrados a <u class="underline-emph">interfaces de programação de aplicações (APIs)</u> de servidores em rede, os quais alimentam incessantemente os repositórios de dados de suas respectivas corporações por meio dos envios.
			</p>
		</details>
	
		<details class="content-section">
			<summary>
				<h4 class="section-heading">🕵️ Problemas de Transparência</h3>
			</summary>
			<p class="mb-4">
				Embora as empresas responsáveis pelo desenvolvimento de algoritmos de aprendizado de máquina afirmem que esse processo é devidamente controlado, entendemos que essa informação permanece consideravelmente <mark class="highlight">obscura e pouco divulgada</mark> ao público em geral. Consequentemente, verifica-se um constante vazamento de dados, comprometendo a privacidade dos usuários.
			</p>
		</details>
	
		<details class="content-section">
			<summary>
				<h4 class="section-heading">✅ Conclusão</h3>
			</summary>
			<p class="mb-4">
				Por fim, o nosso projeto visa <em class="action-emph">mitigar essa vulnerabilidade</em>, protegendo os usuários contra o acesso não autorizado às suas informações confidenciais.
			</p>
		</details>
	</section>
	
	<section id="projectSource" class="mb-4">
		<details class="content-section" open>
			<summary>
				<h4 class="section-heading">🔗 Fonte Aberta</h3>
			</summary>
			<p class="mb-2">
				Em conformidade com o princípio democrático da informação, este projeto é totalmente open-source e pode ser verificado através do seguinte link:
			</p>
			<address id="sourceAddress" class="mb-4">
				<a href="https://github.com/aronboliveira/llm-prompt-purify"
					 target="_blank" rel="noopener"
					 class="underline text-blue-600"
					 aria-label="Link para o repositório do projeto">
					<u class="link-underline">https://github.com/aronboliveira/llm-prompt-purify</u>
				</a>
			</address>
		</details>
	</section>
	
	<footer id="projectFooter" class="mt-6">
		<details class="content-section">
			<summary>
				<h4 class="section-heading">✉️ Colaboração</h3>
			</summary>
			<p>Entre em contato para colaborar!</p>
		</details>
	</footer>
	`,
    en = `
	<section id="projectDescription" aria-labelledby="projectTitle" class="mb-4">
		<details class="content-section" open>
			<summary>
				<h4 class="section-heading">🎯 Main Goal</h3>
			</summary>
			<p class="mb-4">
				The primary objective of <b class="project-name">LLM Prompt Purify</b> is to provide an automated tool for masking sensitive data (including personal, corporate, financial, and other confidential information) in text content, utilizing exclusively <mark class="highlight">client-side JavaScript</mark> to protect users against potential data leaks.
			</p>
		</details>
	
		<details class="content-section">
			<summary>
				<h4 class="section-heading">🔍 Cases Studied</h3>
			</summary>
			<p class="mb-4">
				Our masking focus - the foundation of our text processing methodologies - specifically targets content used for crafting prompts directed to <abbr class="abbr-term" title="Large Language Models">LLMs</abbr>, which currently dominate the field of <abbr class="abbr-term" title="Artificial Intelligence">AI</abbr>.
			</p>
		</details>
	
		<details class="content-section">
			<summary>
				<h4 class="section-heading">🖥️ Technical Integration</h3>
			</summary>
			<p class="mb-4">
				Numerous experts have documented that these models are integrated with <u class="underline-emph">networked server APIs</u> that continuously feed corporate data repositories through user submissions.
			</p>
		</details>
	
		<details class="content-section">
			<summary>
				<h4 class="section-heading">🕵️ Transparency Issues</h3>
			</summary>
			<p class="mb-4">
				While companies developing machine learning algorithms claim this process is properly regulated, we maintain that this information remains substantially <mark class="highlight">opaque and underdisclosed</mark> to the general public, resulting in continuous privacy-compromising data leakage.
			</p>
		</details>
	
		<details class="content-section">
			<summary>
				<h4 class="section-heading">✅ Conclusion</h3>
			</summary>
			<p class="mb-4">
				Ultimately, our project aims to <em class="action-emph">mitigate this vulnerability</em> by protecting users against unauthorized access to confidential information.
			</p>
		</details>
	</section>
	
	<section id="projectSource" class="mb-4">
		<details class="content-section" open>
			<summary>
				<h4 class="section-heading">🔗 Open Source</h3>
			</summary>
			<p class="mb-2">
				In alignment with democratic principles of information access, this project is fully open-source:
			</p>
			<address id="sourceAddress" class="mb-4">
				<a href="https://github.com/aronboliveira/llm-prompt-purify"
					 target="_blank" rel="noopener"
					 class="underline text-blue-600"
					 aria-label="Project repository link">
					<u class="link-underline">https://github.com/aronboliveira/llm-prompt-purify</u>
				</a>
			</address>
		</details>
	</section>
	
	<footer id="projectFooter" class="mt-6">
		<details class="content-section">
			<summary>
				<h4 class="section-heading">✉️ Collaboration</h3>
			</summary>
			<p>Contact us to collaborate!</p>
		</details>
	</footer>
		`;
  switch (lang) {
    case "pt":
      return `<article id="projectInfo" class="projetoInfo p-4" role="article">
			<header class="mb-4">
				<h2 id="projectTitle" class="text-2xl font-bold text-center">
					<mark class="bg-yellow-200">ESTE PROJETO ENCONTRA-SE EM ESTÁGIO INICIAL DE DESENVOLVIMENTO</mark>
				</h2>
			</header>
			${pt}
			</article>`;
    case "en":
      return `<article id="projectInfo" class="project-info p-4" role="article">
			<header class="mb-4">
				${en}
			</header>
	</article>
			`;
    default:
      return `
			<article id="projectInfo" class="project-info p-4" role="article">
				<header class="mb-4">
				</header>
				<details>
					<summary><h3>English</h3></summary>
					${en}
				</details>
				<details>
					<summary><h3>Português</h3></summary>
					${pt}
			</article>
			`;
  }
};
