/**
 * Interface que espelha o nosso JSON. 
 * Garante que não tentaremos acessar propriedades inexistentes.
 */

 interface CursosDados {
  id: number
  titulo: string
  nivel: "Iniciante" | "Intermediário" | "Avançado"
  trilha: string
  descricao: string
}

/* ========================================================================
* MENU (abertura/fechamento do hambúrguer)
* ======================================================================*/

class Nav {
  // Declara a propriedade para o botão, podendo ser o elemento HTML ou nulo
  private btn: HTMLButtonElement | null;
  // Declara a propriedade para o menu (lista de links), podendo ser o elemento ou nulo
  private menu: HTMLElement | null;

  constructor() {
      // Busca o botão no HTML pelo ID e força o tipo (casting) para Button
      this.btn = document.getElementById('btn-menu') as HTMLButtonElement
      // Busca o elemento do menu pelo ID
      this.menu = document.getElementById('menu-links')
      // Verificação de segurança: só prossegue se ambos os elementos existirem na página
      if (this.btn && this.menu) {
          // Chama o método que vai "escutar" as interações do usuário
          this.bindEvents();
      } 
  }

  private bindEvents() : void {
      // Abre/fecha ao clicar no botão
      // A interrogação (?.) é o optional chaining do TypeScript/JavaScript.
      // “Só execute a próxima parte se o que vem antes não for null nem undefined.
      // Se for, pare tudo silenciosamente.”
      this.btn?.addEventListener('click', () => this.toggleMenu());
      
      // Se clicar em um link (âncora) dentro do menu, ele fecha sozinho
      this.menu?.addEventListener('click', (e: Event) => {
          const target = e.target as HTMLElement; 
          if (target.tagName === 'A') {
              this.closeMenu();
          }
      });        
  }

  private toggleMenu(): void {
      // Validação de segurança: se o menu ou botão sumirem do DOM, interrompe a função
      if (!this.menu || !this.btn) return;

      // Alterna a classe 'active' no menu: se tiver, remove; se não tiver, adiciona
      // A variável 'isOpen' recebe true se a classe foi adicionada, ou false se removida
      const isOpen = this.menu.classList.toggle('active');

      // Alterna a classe 'open' no botão (usada para animar o ícone do hambúrguer para o X)
      this.btn.classList.toggle('open');

      // Atualiza o atributo ARIA para que cegos ou pessoas com baixa visão saibam 
      // via leitor de tela se o conteúdo do menu está expandido (true) ou recolhido (false)
      this.btn.setAttribute('aria-expanded', isOpen.toString());
  }

  private closeMenu(): void {
      // O uso do '?' (Optional Chaining) tenta remover a classe 'active' apenas se 'this.menu' existir
      this.menu?.classList.remove('active');
      // Remove a classe 'open' do botão, forçando o ícone a voltar ao estado de hambúrguer
      this.btn?.classList.remove('open');
  }
}

/* ========================================================================
* CURSOS (carregamento, filtro e renderização)
* ======================================================================*/

class Curso {
  private container: HTMLElement | null        // Onde os cards serão inseridos
  private searchInput: HTMLInputElement | null // O campo de busca
  private allCourses: CursosDados[] = []       // Cache local de todos os planos

  constructor() {
      // Tenta localizar no HTML o elemento onde os cards serão exibidos (o grid)
      this.container = document.getElementById('courses-grid')

      // Tenta localizar o campo de entrada de texto usado para o filtro
      // O "as HTMLInputElement" avisa ao TypeScript que este elemento terá a propriedade '.value'
      this.searchInput = document.getElementById('filter-input') as HTMLInputElement

      //Verificação de segurança essencial
      // O código dentro do 'if' só será executado se ambos os elementos acima forem encontrados
      if (this.container && this.searchInput) {
          // Inicia o processo de busca de dados (fetch) e configuração do sistema
          this.init()
      }
  }
  // Promessa
  private async init(): Promise<void> {
      try {
          // Busca o arquivo JSON de forma assíncrona
          const response = await fetch('./cursos.json')
          if (!response.ok) throw new Error('Erro ao carregar dados')

          // Converte a resposta bruta em um objeto JS/TS
          this.allCourses = await response.json()
          this.render(this.allCourses)  // Desenha os cards iniciais
          this.setupFilter() // Ativa o campo de busca
      } catch (error) {
          // Caso o arquivo falte ou o servidor caia, avisa o usuário
          if (this.container) {
              this.container.innerHTML = `<p class="loading">Erro ao carregar os planos.</p>`;
          }
      }
  }

  private norm(text: string): string {
      return text
          .normalize('NFD')                  // separa letras de acentos (ex.: "ó" -> "o" + " ́")
          .replace(/[\u0300-\u036f]/g, '')   // remove os diacríticos (acentos)
          .toLowerCase();                    // busca case-insensitive
      
  }

  private setupFilter(): void {
      // Adiciona um ouvinte ao input de busca que dispara toda vez que o usuário digita algo
      this.searchInput?.addEventListener('input', () => {         
          // Captura o valor digitado e normaliza
          // Se o valor for nulo, define uma string vazia como padrão
          const queryRaw = this.searchInput?.value.toLowerCase() || ""
          const query = this.norm(queryRaw)

          // Cria um novo array apenas com os planos que atendem aos critérios de busca
          const filtered = this.allCourses.filter(p => {
              const tituloNorm = this.norm(p.titulo)
              const nivelNorm = this.norm(p.nivel)
              const trilhaNorm = this.norm(p.trilha)

              return (
              // Critério 1: O título do curso contém o que foi digitado?
              tituloNorm.includes(query) ||  
              // Critério 2: O nível do curso contém o que foi digitado?
              nivelNorm.includes(query) ||  
              // Critério 3: A trilha do curso contém o que foi digitado?
              trilhaNorm.includes(query)          
          )
      });

          // Chama o método de renderização passando apenas a lista filtrada para atualizar a tela
          this.render(filtered); 
      });
  }

  private render(cursos: CursosDados[]) : void {
      if (!this.container) return;

      // Se a busca não encontrar nada, exibe mensagem amigável
      if (cursos.length === 0) {
          this.container.innerHTML = `<p class="loading">Nenhum curso encontrado.</p>`;
          return;
      }

      // Transforma cada objeto de plano em um bloco de HTML (Card)
      this.container.innerHTML = cursos.map(p => `
          <article class="card">
          <div class="card-content">
              <span class="level">${p.nivel}</span>
              <h2>${p.titulo}</h2>
              <p><strong>${p.trilha}:</strong> ${p.descricao}</p>
          </div>
          <div class=card-footer>
          <button>Saber Mais</button>
          </div>
          </article>
      `).join(''); // O .join('') evita que apareçam vírgulas entre os cards
  }
}

/* ========================================================================
* BOOTSTRAP (inicialização segura quando o DOM está pronto)
* ======================================================================*/
window.addEventListener('DOMContentLoaded', () => {
  new Nav(); // Instancia o menu
  new Curso();      // Instancia o buscador de cursos */
});