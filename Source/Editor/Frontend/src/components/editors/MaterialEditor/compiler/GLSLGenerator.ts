import { Node, Edge } from 'reactflow';

export interface CompilationContext {
    nodes: Node[];
    edges: Edge[];
    declarations: string[]; // Uniforms/Varyings
    statements: string[];   // Main function body
    variableCount: number;
}

export const processNode = (node: Node, context: CompilationContext): string => {
    return generateNodeCode(node, context);
};

export const getOutputVarName = (context: CompilationContext): string => {
    return `var_${++context.variableCount}`;
};

const resolveInput = (nodeId: string, handleId: string, context: CompilationContext, defaultValue: string = "0.0"): string => {
    const edge = context.edges.find(e => e.target === nodeId && e.targetHandle === handleId);
    if (edge) {
        const sourceNode = context.nodes.find(n => n.id === edge.source);
        if (sourceNode) {
            return processNode(sourceNode, context);
        }
    }
    return defaultValue;
};

export const generateNodeCode = (node: Node, context: CompilationContext): string => {
    switch (node.type) {
        case 'result': return generateResultNode(node, context);
        case 'color': return generateColorNode(node, context);
        case 'add':
        case 'multiply':
        case 'subtract':
        case 'divide': return generateMathNode(node, context);
        case 'texture': return generateTextureNode(node, context);
        case 'clamp': return generateClampNode(node, context);
        case 'lerp': return generateLerpNode(node, context);
        case 'step': return generateStepNode(node, context);
        case 'smoothstep': return generateSmoothStepNode(node, context);
        case 'vector': return generateVectorConstructNode(node, context);
        case 'mask': return generateComponentMaskNode(node, context);
        default: return `// Unknown node type: ${node.type}`;
    }
};

// --- Node Implementations ---

const generateResultNode = (node: Node, context: CompilationContext): string => {
    const baseColor = resolveInput(node.id, 'base-color', context, "vec3(0.0, 0.0, 0.0)");
    const opacity = resolveInput(node.id, 'opacity', context, "vec3(1.0)");

    // Ensure opacity is treated as float (take Red component if vec3)
    // Note: resolveInput currently returns vec3 vars for most nodes.

    context.statements.push(`
    // Material Output
    vec3 albedo = ${baseColor};
    float alpha = ${opacity}.r; // Fix: Extract scalar from vec3
    
    // Basic Lighting (Blinn-Phong) using Fixed Function Light 0
    vec3 N = normalize(v_Normal);
    vec3 L = normalize(gl_LightSource[0].position.xyz);
    
    // Diffuse
    float NdotL = max(dot(N, L), 0.0);
    vec3 diffuse = gl_LightSource[0].diffuse.rgb * NdotL;
    
    // Ambient
    vec3 ambient = gl_LightSource[0].ambient.rgb;
    
    // Specular (Simple)
    vec3 V = normalize(-gl_ModelViewMatrix[3].xyz); // Approximate View Dir (local viewer)
    // Actually for ortho/perspective in simple preview, Light is often camera relative or fixed.
    // Let's stick to simple Diffuse + Ambient for "Basic" preview.
    
    vec3 finalRGB = albedo * (ambient + diffuse);
    
    gl_FragColor = vec4(finalRGB, alpha);
    `);

    return "void";
};

const generateColorNode = (node: Node, context: CompilationContext): string => {
    const colorHex = node.data.color || '#ffffff';
    const r = parseInt(colorHex.substr(1, 2), 16) / 255.0;
    const g = parseInt(colorHex.substr(3, 2), 16) / 255.0;
    const b = parseInt(colorHex.substr(5, 2), 16) / 255.0;

    const varName = getOutputVarName(context);
    context.statements.push(`vec3 ${varName} = vec3(${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)});`);
    return varName;
};

const generateMathNode = (node: Node, context: CompilationContext): string => {
    const a = resolveInput(node.id, 'a', context, "0.0");
    const b = resolveInput(node.id, 'b', context, "0.0");
    const varName = getOutputVarName(context);

    let op = '+';
    switch (node.type) {
        case 'add': op = '+'; break;
        case 'multiply': op = '*'; break;
        case 'subtract': op = '-'; break;
        case 'divide': op = '/'; break;
    }

    context.statements.push(`vec3 ${varName} = vec3(${a}) ${op} vec3(${b});`);
    return varName;
};

const generateTextureNode = (node: Node, context: CompilationContext): string => {
    const assetId = node.data.textureAssetId;
    let actualTexName = `t_TextureError`;

    if (assetId) {
        const sanitized = assetId.replace(/[^a-zA-Z0-9]/g, '_');
        actualTexName = `t_${sanitized}`;
        const decl = `uniform sampler2D ${actualTexName};`;
        if (!context.declarations.includes(decl)) {
            context.declarations.push(decl);
        }
    }

    const uv = "v_TexCoord"; // GLSL varying
    const varName = getOutputVarName(context);

    if (assetId) {
        context.statements.push(`vec3 ${varName} = texture2D(${actualTexName}, ${uv}).rgb;`);
    } else {
        context.statements.push(`vec3 ${varName} = vec3(1.0, 0.0, 1.0); // Missing Texture`);
    }

    return varName;
};

const generateClampNode = (node: Node, context: CompilationContext): string => {
    const input = resolveInput(node.id, 'input', context, "vec3(0.0)");
    const min = resolveInput(node.id, 'min', context, "0.0");
    const max = resolveInput(node.id, 'max', context, "1.0");
    const varName = getOutputVarName(context);
    context.statements.push(`vec3 ${varName} = clamp(vec3(${input}), vec3(${min}), vec3(${max}));`);
    return varName;
};

const generateLerpNode = (node: Node, context: CompilationContext): string => {
    const a = resolveInput(node.id, 'a', context, "vec3(0.0)");
    const b = resolveInput(node.id, 'b', context, "vec3(1.0)");
    const t = resolveInput(node.id, 't', context, "0.5");
    const varName = getOutputVarName(context);
    context.statements.push(`vec3 ${varName} = mix(vec3(${a}), vec3(${b}), vec3(${t}));`);
    return varName;
};

const generateStepNode = (node: Node, context: CompilationContext): string => {
    const edge = resolveInput(node.id, 'edge', context, "0.5");
    const x = resolveInput(node.id, 'x', context, "0.0");
    const varName = getOutputVarName(context);
    context.statements.push(`vec3 ${varName} = step(vec3(${edge}), vec3(${x}));`);
    return varName;
};

const generateSmoothStepNode = (node: Node, context: CompilationContext): string => {
    const min = resolveInput(node.id, 'min', context, "0.0");
    const max = resolveInput(node.id, 'max', context, "1.0");
    const x = resolveInput(node.id, 'x', context, "0.5");
    const varName = getOutputVarName(context);
    context.statements.push(`vec3 ${varName} = smoothstep(vec3(${min}), vec3(${max}), vec3(${x}));`);
    return varName;
};

const generateVectorConstructNode = (node: Node, context: CompilationContext): string => {
    const x = resolveInput(node.id, 'x', context, "0.0");
    const y = resolveInput(node.id, 'y', context, "0.0");
    const z = resolveInput(node.id, 'z', context, "0.0");
    const varName = getOutputVarName(context);
    context.statements.push(`vec3 ${varName} = vec3(${x}, ${y}, ${z});`);
    return varName;
};

const generateComponentMaskNode = (node: Node, context: CompilationContext): string => {
    const input = resolveInput(node.id, 'input', context, "vec3(0,0,0)");
    const varName = getOutputVarName(context);
    const mask = node.data.mask || 'r';

    // GLSL swizzles correspond to rgba or xyzw
    // HLSL mask usually matches. 'r', 'g', 'b', 'a' are standard.

    if (mask.length === 1) {
        context.statements.push(`vec3 ${varName} = vec3(${input}.${mask});`);
    } else if (mask.length === 2) {
        context.statements.push(`vec3 ${varName} = vec3(${input}.${mask}, 0.0);`);
    } else {
        context.statements.push(`vec3 ${varName} = ${input}.${mask};`);
    }

    return varName;
};


// --- Main Compilation Function ---

export const compileGraphToGLSL = (nodes: Node[], edges: Edge[]) => {
    const context: CompilationContext = {
        nodes,
        edges,
        declarations: [],
        statements: [],
        variableCount: 0
    };

    // Find result node
    const resultNode = nodes.find(n => n.type === 'result');
    if (!resultNode) return { vertex: "", fragment: "" };

    // Start generation from result node
    processNode(resultNode, context);

    // Fragment Shader
    const fragmentCode = `
#version 120
varying vec2 v_TexCoord;
varying vec3 v_Normal;

${context.declarations.join('\n')}

void main() {
    ${context.statements.join('\n')}
}
    `.trim();

    // Vertex Shader (Compatible with immediate mode)
    // We assume backend passes ModelViewProjection and Vertex/TexCoord via standard attributes or compatible built-ins
    const vertexCode = `
#version 120
varying vec2 v_TexCoord;
varying vec3 v_Normal;

void main() {
    v_TexCoord = gl_MultiTexCoord0.xy;
    v_Normal = gl_Normal;
    gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;
}
    `.trim();

    return { vertex: vertexCode, fragment: fragmentCode };
};
