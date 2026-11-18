export type TomNotificacao = "perigo" | "aviso" | "ok" | "neutro";

export interface NotificacaoItem {
  id: string;
  tipo: "vacina" | "agenda" | "estoque";
  titulo: string;
  detalhe?: string;
  quando: string;
  link: string;
  tom: TomNotificacao;
}

export interface ResumoNotificacoes {
  total: number;
  itens: NotificacaoItem[];
}
