import json
from http.server import BaseHTTPRequestHandler

# Lista de lições simulando o banco de dados em memória
licoes = [
    {"id": 1, "titulo": "1. Hello World no Terminal", "descricao": "No VS Code, crie um arquivo 'main.py'. Use a função print para exibir a frase: Olá, PySchool!", "xp": 50},
    {"id": 2, "titulo": "2. Variáveis e Tipos", "descricao": "Crie uma variável 'nome' com seu nome e uma 'idade' com um número. Imprima: 'Meu nome é [nome] e tenho [idade] anos.'", "xp": 50},
    {"id": 3, "titulo": "3. Entrada de Dados (Input)", "descricao": "Simule a leitura do terminal. Peça a idade do usuário e imprima 'Você tem X anos.'", "xp": 50},
    {"id": 4, "titulo": "4. Estruturas Condicionais (If/Else)", "descricao": "Crie uma variável 'nota'. Se for maior ou igual a 7, imprima 'Aprovado'. Senão, 'Reprovado'.", "xp": 50},
    {"id": 5, "titulo": "5. Laços de Repetição (For)", "descricao": "Use um loop for para imprimir os números de 1 a 5, cada um em uma linha.", "xp": 50},
    {"id": 6, "titulo": "6. Trabalhando com Listas", "descricao": "Crie uma lista com 'Maçã', 'Banana' e 'Uva'. Imprima o segundo item da lista.", "xp": 50},
    {"id": 7, "titulo": "7. Laço While", "descricao": "Use um while para imprimir uma contagem regressiva de 3 a 1, depois imprima 'Fogo!'.", "xp": 50},
    {"id": 8, "titulo": "8. Criando Funções", "descricao": "Crie uma função 'saudar(nome)' que retorna 'Bem-vindo, [nome]!'. Chame a função para 'Python'.", "xp": 50},
    {"id": 9, "titulo": "9. Dicionários", "descricao": "Crie um dicionário 'pessoa' com chaves 'nome' e 'idade'. Imprima apenas a idade.", "xp": 50},
    {"id": 10, "titulo": "10. Manipulação de Arquivos (Local)", "descricao": "Simule a escrita em um arquivo 'dados.txt' e leia em seguida. Imprima o conteúdo lido.", "xp": 50}
]

# Classe handler exigida pela Vercel para funções serverless
class handler(BaseHTTPRequestHandler):
    
    # Método que responde a requisições GET
    def do_GET(self):
        # Converte a lista de lições para uma string JSON
        corpo_resposta = json.dumps(licoes)
        
        # Define o status da resposta como 200 (OK)
        self.send_response(200)
        
        # Define o cabeçalho de conteúdo como JSON com charset UTF-8
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        
        # Escreve o corpo da resposta em bytes no retorno
        self.wfile.write(corpo_resposta.encode('utf-8'))