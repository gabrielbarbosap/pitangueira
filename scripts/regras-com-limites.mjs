// Gera `firestore.rules.com-limites` a partir de `firestore.rules`: criar e restaurar projeto passam a exigir a
// autorização que o servidor grava depois de conferir o plano. Use SÓ depois de configurar o servidor (README, "Planos e limites").
//   node scripts/regras-com-limites.mjs
import fs from "node:fs";

let s = fs.readFileSync("firestore.rules", "utf8");
const troca = (de, para) => {
  if (!s.includes(de)) throw new Error(`Trecho não encontrado nas regras: ${de.slice(0, 60)}`);
  s = s.replace(de, para);
};

troca(
  "    function soAltera(campos) {",
  `    // Licença de criar/restaurar projeto: existe, não venceu e é consumida (apagada) na mesma gravação.
    function autorizado() {
      let a = /databases/$(database)/documents/autorizacoes/$(request.auth.uid);
      return exists(a) && get(a).data.ate > request.time.toMillis() && !existsAfter(a);
    }
    // Tirar um projeto do arquivo ocupa uma vaga do plano.
    function restaurando() {
      return resource.data.get('arquivada', false) == true && request.resource.data.get('arquivada', false) == false;
    }
    function soAltera(campos) {`,
);
troca("allow create: if signedIn() && request.resource.data.ownerUid == request.auth.uid;", "allow create: if signedIn() && request.resource.data.ownerUid == request.auth.uid && autorizado();");
troca("allow update: if (ehDono(resource.data) && previsoesOk())", "allow update: if (ehDono(resource.data) && previsoesOk() && (!restaurando() || autorizado()))");

fs.writeFileSync("firestore.rules.com-limites", `// GERADO por scripts/regras-com-limites.mjs a partir de firestore.rules. Não edite à mão.\n${s}`);
console.log("Gerado firestore.rules.com-limites");
