/**
 * railway.ts — Typed logic for Railway GraphQL API
 */

export interface RailwayDeployment {
  id: string;
  status: string;
  createdAt: string;
  projectName: string;
  environmentName: string;
}

export interface RailwayProxyResponse {
  deployments: RailwayDeployment[];
}

export interface RailwayGqlResponse {
  data: {
    projects: {
      edges: {
        node: {
          name: string;
          deployments: {
            edges: {
              node: {
                id: string;
                status: string;
                createdAt: string;
                environment: {
                  name: string;
                };
              }
            }[];
          };
        };
      }[];
    };
  };
}
