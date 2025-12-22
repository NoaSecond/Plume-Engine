import { Node, Edge } from 'reactflow';
import { CompilationContext, processNode } from './HLSLCompiler';

export const getOutputVarName = (context: CompilationContext): string => {
    return `var_${++context.variableCount}`;
};

export const generateNodeCode = (node: Node, context: CompilationContext): string => {
    switch (node.type) {
        case 'result':
            return generateResultNode(node, context);
        case 'color':
            return generateColorNode(node, context);
        case 'add':
        case 'multiply':
        case 'subtract':
        case 'divide':
            return generateMathNode(node, context);
        case 'texture':
            return generateTextureNode(node, context);
        case 'clamp':
            return generateClampNode(node, context);
        case 'lerp':
            return generateLerpNode(node, context);
        case 'step':
            return generateStepNode(node, context);
        case 'smoothstep':
            return generateSmoothStepNode(node, context);
        case 'vector':
            return generateVectorConstructNode(node, context);
        case 'mask':
            return generateComponentMaskNode(node, context);
        default:
            return `// Unknown node type: ${node.type}`;
    }
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

const generateResultNode = (node: Node, context: CompilationContext): string => {
    const baseColor = resolveInput(node.id, 'base-color', context, "float3(0.0, 0.0, 0.0)");
    const opacity = resolveInput(node.id, 'opacity', context, "1.0");

    context.statements.push(`
    // Material Output
    float3 finalColor = ${baseColor};
    float finalAlpha = ${opacity};
    
    output.color = float4(finalColor, finalAlpha);
    `);

    return "void";
};

const generateColorNode = (node: Node, context: CompilationContext): string => {
    const colorHex = node.data.color || '#ffffff';
    const r = parseInt(colorHex.substr(1, 2), 16) / 255.0;
    const g = parseInt(colorHex.substr(3, 2), 16) / 255.0;
    const b = parseInt(colorHex.substr(5, 2), 16) / 255.0;

    const varName = getOutputVarName(context);
    context.statements.push(`float3 ${varName} = float3(${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)});`);
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

    context.statements.push(`float3 ${varName} = ${a} ${op} ${b};`);
    return varName;
};

const generateTextureNode = (node: Node, context: CompilationContext): string => {
    // Check if we already declared a texture for this asset
    const assetId = node.data.textureAssetId;
    let actualTexName = `t_TextureError`;

    if (assetId) {
        // Simple sanitization
        const sanitized = assetId.replace(/[^a-zA-Z0-9]/g, '_');
        actualTexName = `t_${sanitized}`;

        const decl = `Texture2D ${actualTexName} : register(t${context.declarations.length});`;
        const samplerDecl = `SamplerState s_${sanitized} : register(s${context.declarations.length});`;

        if (!context.declarations.includes(decl)) {
            context.declarations.push(decl);
            context.declarations.push(samplerDecl);
        }
    }

    const uv = "input.uv"; // Default UV from pixel input
    const varName = getOutputVarName(context);

    if (assetId) {
        const sanitized = assetId.replace(/[^a-zA-Z0-9]/g, '_');
        context.statements.push(`float4 ${varName}_raw = ${actualTexName}.Sample(s_${sanitized}, ${uv});`);
        context.statements.push(`float3 ${varName} = ${varName}_raw.rgb;`);
    } else {
        context.statements.push(`float3 ${varName} = float3(1.0, 0.0, 1.0); // Missing Texture`);
    }

    return varName;
};

const generateClampNode = (node: Node, context: CompilationContext): string => {
    const input = resolveInput(node.id, 'input', context, "0.0");
    const min = resolveInput(node.id, 'min', context, "0.0");
    const max = resolveInput(node.id, 'max', context, "1.0");
    const varName = getOutputVarName(context);
    context.statements.push(`float3 ${varName} = clamp(${input}, ${min}, ${max});`);
    return varName;
};

const generateLerpNode = (node: Node, context: CompilationContext): string => {
    const a = resolveInput(node.id, 'a', context, "0.0");
    const b = resolveInput(node.id, 'b', context, "1.0");
    const t = resolveInput(node.id, 't', context, "0.5");
    const varName = getOutputVarName(context);
    context.statements.push(`float3 ${varName} = lerp(${a}, ${b}, ${t});`);
    return varName;
};

const generateStepNode = (node: Node, context: CompilationContext): string => {
    const edge = resolveInput(node.id, 'edge', context, "0.5");
    const x = resolveInput(node.id, 'x', context, "0.0");
    const varName = getOutputVarName(context);
    context.statements.push(`float3 ${varName} = step(${edge}, ${x});`);
    return varName;
};

const generateSmoothStepNode = (node: Node, context: CompilationContext): string => {
    const min = resolveInput(node.id, 'min', context, "0.0");
    const max = resolveInput(node.id, 'max', context, "1.0");
    const x = resolveInput(node.id, 'x', context, "0.5");
    const varName = getOutputVarName(context);
    context.statements.push(`float3 ${varName} = smoothstep(${min}, ${max}, ${x});`);
    return varName;
};

const generateVectorConstructNode = (node: Node, context: CompilationContext): string => {
    const x = resolveInput(node.id, 'x', context, "0.0");
    const y = resolveInput(node.id, 'y', context, "0.0");
    const z = resolveInput(node.id, 'z', context, "0.0");
    const varName = getOutputVarName(context);
    context.statements.push(`float3 ${varName} = float3(${x}, ${y}, ${z});`);
    return varName;
};

const generateComponentMaskNode = (node: Node, context: CompilationContext): string => {
    const input = resolveInput(node.id, 'input', context, "float3(0,0,0)");
    const varName = getOutputVarName(context);
    const mask = node.data.mask || 'r';

    if (mask.length === 1) {
        context.statements.push(`float3 ${varName} = float3(${input}.${mask}, ${input}.${mask}, ${input}.${mask});`);
    } else if (mask.length === 2) {
        context.statements.push(`float3 ${varName} = float3(${input}.${mask}, 0.0);`);
    } else {
        context.statements.push(`float3 ${varName} = ${input}.${mask};`);
    }

    return varName;
};
