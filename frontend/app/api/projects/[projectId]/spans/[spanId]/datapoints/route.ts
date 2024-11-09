import { db } from "@/lib/db/drizzle";
import { datapointToSpan } from "@/lib/db/migrations/schema";
import { isCurrentUserMemberOfProject } from "@/lib/db/utils";
import { eq } from "drizzle-orm";


export async function GET(
  request: Request,
  { params }: { params: { projectId: string; spanId: string } }
) {

  const { projectId, spanId } = params;

  if (!(await isCurrentUserMemberOfProject(projectId))) {
    return new Response('Unauthorized', { status: 401 });
  }

  const datapoints = await db.query.datapointToSpan.findMany({
    where: eq(datapointToSpan.spanId, spanId),
    with: {
      datasetDatapoint: {
        with: {
          dataset: true
        }
      }
    },
  });

  // Flatten the structure
  const flattenedDatapoints = datapoints.map(dp => ({
    datapointId: dp.datasetDatapoint.id,
    datasetId: dp.datasetDatapoint.dataset.id,
    datasetName: dp.datasetDatapoint.dataset.name
  }));

  return Response.json(flattenedDatapoints);
}
