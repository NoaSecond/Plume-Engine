import { Node, Edge } from 'reactflow';
import { generateNodeCode, getOutputVarName } from './NodeGenerators';

export interface CompilationContext {
    nodes: Node[];
    edges: Edge[];
    visited: Set<string>;
    statements: string[]; // Lines of code inside main()
    declarations: string[]; // Global uniforms/textures
    variableCount: number;
    nodeVarMap: Map<string, string>; // NodeID -> VariableName (e.g. "var_1")
    errors: string[];
}

export const compileMaterial = (nodes: Node[], edges: Edge[]): string => {
    const context: CompilationContext = {
        nodes,
        edges,
        visited: new Set(),
        statements: [],
        declarations: [],
        variableCount: 0,
        nodeVarMap: new Map(),
        errors: []
    };

    // 1. Find Result Node
    const resultNode = nodes.find(n => n.type === 'result');
    if (!resultNode) {
        return "// Error: No Result Node found.";
    }

    // 2. Process Result Node (recursively processes inputs)
    try {
        processNode(resultNode, context);
    } catch (e: any) {
        context.errors.push(e.message);
    }

    // 3. Assemble Shader
    const declarations = context.declarations.join('\n');
    const statements = context.statements.join('\n    ');

    const defaultStructs = `
struct PixelInput {
    float4 position : SV_POSITION;
    float2 uv : TEXCOORD0;
    float3 normal : NORMAL;
    float3 worldPos : TEXCOORD1;
};

struct PixelOutput {
    float4 color : SV_TARGET0;
};
`;

    if (context.errors.length > 0) {
        return `// Errors:\n// ${context.errors.join('\n// ')}`;
    }

    return `// Auto-generated HLSL by Plume Material Editor
${defaultStructs}

${declarations}

PixelOutput main(PixelInput input) {
    PixelOutput output;
    
    // Material Logic
    ${statements}

    return output;
}`;
};

export const processNode = (node: Node, context: CompilationContext): string => {
    // If already visited, return its generic variable name
    if (context.nodeVarMap.has(node.id)) {
        return context.nodeVarMap.get(node.id)!;
    }

    // Mark as visited (cycle detection could be added here)
    context.visited.add(node.id);

    // Generate code for this node
    // This might recurse back to processNode for its inputs
    const varName = generateNodeCode(node, context);

    context.nodeVarMap.set(node.id, varName);
    return varName;
};
