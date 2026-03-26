import { NextResponse } from "next/server";
import { RailwayGqlResponse, RailwayDeployment } from "@/lib/railway";

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  const query = `
    query GetRailwayDeployments {
      projects {
        edges {
          node {
            name
            deployments(first: 5) {
              edges {
                node {
                  id
                  status
                  createdAt
                  environment {
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch("https://backboard.railway.app/graphql/v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Railway API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data: RailwayGqlResponse = await response.json();
    
    // Flatten projects and deployments into a single array
    const deployments: RailwayDeployment[] = [];
    
    data.data.projects.edges.forEach((projectEdge) => {
      const projectName = projectEdge.node.name;
      projectEdge.node.deployments.edges.forEach((deploymentEdge) => {
        const d = deploymentEdge.node;
        deployments.push({
          id: d.id,
          status: d.status,
          createdAt: d.createdAt,
          projectName: projectName,
          environmentName: d.environment.name,
        });
      });
    });

    // Sort all deployments from all projects by date descending
    deployments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ deployments });
  } catch (error) {
    console.error("Railway Proxy Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
