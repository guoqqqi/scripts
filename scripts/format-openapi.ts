import fs from 'fs';
import { join } from 'path';

const targetPath = join('./data', 'APISIX_Admin_API_OpenAPI-3.1.json');

type OpenAPIFileType = {
  info: {
    title: string;
    description: string;
    version: string;
  };
  servers: {
    url: string;
    description: string;
  }[];
  paths: {
    [key: string]: {
      [key: string]: {
        requestBody: {
          content: {
            'application/json': {
              schema: any;
            };
          };
        };
      };
    };
  };
  components: {
    schemas: {};
  };
  tags: {
    name: string;
  }[];
};

type SchemaListType = {
  main: {
    [key: string]: any;
  };
};

const formatSchemaList = {
  route: [
    {
      path: '/apisix/admin/routes',
      methods: ['post'],
    },
    {
      path: '/apisix/admin/routes/{id}',
      methods: ['put', 'patch'],
    },
    {
      path: '/apisix/admin/routes/{id}/{path}',
      methods: ['patch'],
    }
  ],
  upstream: [
    {
      path: '/apisix/admin/upstreams',
      methods: ['post'],
    },
    {
      path: '/apisix/admin/upstreams/{id}',
      methods: ['patch', 'put'],
    },
  ],
};

const getOpenAPIFile = async () => {
  const targetOpenAPIFile = fs.readFileSync(targetPath, 'utf8');
  const jsonschemaData = fs.readFileSync(
    join('./data', 'jsonschema.json'),
    'utf8'
  );
  const openAPIData = JSON.parse(targetOpenAPIFile) as OpenAPIFileType;
  const jsonschema = JSON.parse(jsonschemaData) as SchemaListType;

  // replace the schema
  const schemaList = Object.entries(formatSchemaList);
  schemaList.forEach(async ([name, data]) => {
    const schema = jsonschema.main[name];
    const formatSchema = await Promise.all(
      data.map(({ path, methods }) => {
        console.log('methods: ', methods);
        methods.forEach((method) => {
          openAPIData.paths[path][method].requestBody.content[
            'application/json'
          ].schema = schema;
        });
      })
    ).then(() => {
      return openAPIData;
    }).catch((err) => {
      console.log('err: ', err);
    });

    // write this new file
    fs.writeFileSync(join('./data', 'new.json'), JSON.stringify(formatSchema, null, 2));
  });
};

getOpenAPIFile();
