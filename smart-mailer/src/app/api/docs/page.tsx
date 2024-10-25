import { getApiDocs } from "@/lib/swagger";
import ReactSwagger from "@/lib/components/swagger/swagger";

export default async function Docs() {
  const spec = await getApiDocs();
  return (
    <section className="container">
      <ReactSwagger spec={spec} />
    </section>
  );
}
