import { getApiDocs } from "@/lib/swagger";
import ReactSwagger from "@/components/swagger/swagger";

export default async function Docs() {
  const spec = await getApiDocs();
  return (
    <section className="container m-auto">
      <ReactSwagger spec={spec} />
    </section>
  );
}
