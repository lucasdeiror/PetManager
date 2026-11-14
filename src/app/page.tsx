import { redirect } from "next/navigation";

// A agenda é a tela de trabalho diário; um painel com métricas fica para um lote futuro.
export default function Home() {
  redirect("/agenda");
}
