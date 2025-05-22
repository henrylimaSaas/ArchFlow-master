import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator as CalculatorIcon, ToyBrick, Square, Paintbrush, Zap } from "lucide-react";

export default function Calculator() {
  // ToyBrick Calculator State
  const [brickLength, setBrickLength] = useState("");
  const [brickHeight, setBrickHeight] = useState("");
  const [wallLength, setWallLength] = useState("");
  const [wallHeight, setWallHeight] = useState("");
  const [brickType, setBrickType] = useState("9x19x39");
  const [brickWaste, setBrickWaste] = useState("10");

  // Flooring Calculator State
  const [floorWidth, setFloorWidth] = useState("");
  const [floorLength, setFloorLength] = useState("");
  const [tileSize, setTileSize] = useState("60x60");
  const [floorWaste, setFloorWaste] = useState("5");

  // Paint Calculator State
  const [paintArea, setPaintArea] = useState("");
  const [paintCoats, setPaintCoats] = useState("2");
  const [paintRendering, setPaintRendering] = useState("12");

  // Concrete Calculator State
  const [concreteLength, setConcreteLength] = useState("");
  const [concreteWidth, setConcreteWidth] = useState("");
  const [concreteThickness, setConcreteThickness] = useState("");
  const [concreteRatio, setConcreteRatio] = useState("1:2:3");

  // Calculation Results
  const [results, setResults] = useState<any>({});

  const brickTypes = {
    "9x19x39": { width: 9, height: 19, length: 39 },
    "9x14x39": { width: 9, height: 14, length: 39 },
    "11.5x19x39": { width: 11.5, height: 19, length: 39 },
  };

  const tileSizes = {
    "30x30": { width: 30, height: 30 },
    "45x45": { width: 45, height: 45 },
    "60x60": { width: 60, height: 60 },
    "80x80": { width: 80, height: 80 },
  };

  const concreteRatios = {
    "1:2:3": { cement: 1, sand: 2, gravel: 3 },
    "1:2:4": { cement: 1, sand: 2, gravel: 4 },
    "1:3:4": { cement: 1, sand: 3, gravel: 4 },
  };

  const calculateBricks = () => {
    const wLength = parseFloat(wallLength);
    const wHeight = parseFloat(wallHeight);
    const waste = parseFloat(brickWaste) / 100;
    
    if (!wLength || !wHeight) return;

    const wallArea = wLength * wHeight;
    const brick = brickTypes[brickType as keyof typeof brickTypes];
    
    // Convert brick dimensions from cm to m
    const brickArea = (brick.length / 100) * (brick.height / 100);
    
    // Calculate number of bricks needed
    const bricksNeeded = Math.ceil((wallArea / brickArea) * (1 + waste));
    
    // Calculate mortar (approximately 0.3 m³ per 1000 bricks)
    const mortarVolume = (bricksNeeded / 1000) * 0.3;

    setResults({
      ...results,
      bricks: {
        quantity: bricksNeeded,
        wallArea: wallArea.toFixed(2),
        mortarVolume: mortarVolume.toFixed(3),
        wasteIncluded: `${brickWaste}%`,
      }
    });
  };

  const calculateFlooring = () => {
    const width = parseFloat(floorWidth);
    const length = parseFloat(floorLength);
    const waste = parseFloat(floorWaste) / 100;
    
    if (!width || !length) return;

    const area = width * length;
    const tile = tileSizes[tileSize as keyof typeof tileSizes];
    
    // Convert tile size from cm to m²
    const tileArea = (tile.width / 100) * (tile.height / 100);
    
    // Calculate number of tiles needed
    const tilesNeeded = Math.ceil((area / tileArea) * (1 + waste));
    
    // Calculate total area with waste
    const totalArea = area * (1 + waste);

    setResults({
      ...results,
      flooring: {
        area: area.toFixed(2),
        totalArea: totalArea.toFixed(2),
        tiles: tilesNeeded,
        wasteIncluded: `${floorWaste}%`,
      }
    });
  };

  const calculatePaint = () => {
    const area = parseFloat(paintArea);
    const coats = parseInt(paintCoats);
    const rendering = parseFloat(paintRendering);
    
    if (!area || !coats || !rendering) return;

    const totalArea = area * coats;
    const litersNeeded = totalArea / rendering;
    const cansNeeded = Math.ceil(litersNeeded / 18); // Assuming 18L cans

    setResults({
      ...results,
      paint: {
        area: area.toFixed(2),
        totalArea: totalArea.toFixed(2),
        liters: litersNeeded.toFixed(2),
        cans: cansNeeded,
        coats: coats,
      }
    });
  };

  const calculateConcrete = () => {
    const length = parseFloat(concreteLength);
    const width = parseFloat(concreteWidth);
    const thickness = parseFloat(concreteThickness);
    
    if (!length || !width || !thickness) return;

    const volume = length * width * (thickness / 100); // thickness in cm to m
    const ratio = concreteRatios[concreteRatio as keyof typeof concreteRatios];
    
    const totalParts = ratio.cement + ratio.sand + ratio.gravel;
    const cementVolume = (volume * ratio.cement) / totalParts;
    const sandVolume = (volume * ratio.sand) / totalParts;
    const gravelVolume = (volume * ratio.gravel) / totalParts;
    
    // Convert cement volume to bags (50kg bags, approximately 0.033 m³ per bag)
    const cementBags = Math.ceil(cementVolume / 0.033);

    setResults({
      ...results,
      concrete: {
        volume: volume.toFixed(3),
        cement: cementBags,
        cementVolume: cementVolume.toFixed(3),
        sand: sandVolume.toFixed(3),
        gravel: gravelVolume.toFixed(3),
        ratio: concreteRatio,
      }
    });
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <CalculatorIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
                Calculadora de Obra
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Calcule quantidades de materiais para sua obra
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="bricks" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="bricks" className="flex items-center space-x-2">
              <ToyBrick className="w-4 h-4" />
              <span>Tijolos</span>
            </TabsTrigger>
            <TabsTrigger value="flooring" className="flex items-center space-x-2">
              <Square className="w-4 h-4" />
              <span>Piso</span>
            </TabsTrigger>
            <TabsTrigger value="paint" className="flex items-center space-x-2">
              <Paintbrush className="w-4 h-4" />
              <span>Tinta</span>
            </TabsTrigger>
            <TabsTrigger value="concrete" className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Concreto</span>
            </TabsTrigger>
          </TabsList>

          {/* ToyBrick Calculator */}
          <TabsContent value="bricks">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ToyBrick className="w-5 h-5 text-orange-600" />
                    <span>Cálculo de Tijolos</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="wall-length">Comprimento do Muro (m)</Label>
                      <Input
                        id="wall-length"
                        type="number"
                        placeholder="10.0"
                        value={wallLength}
                        onChange={(e) => setWallLength(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="wall-height">Altura do Muro (m)</Label>
                      <Input
                        id="wall-height"
                        type="number"
                        placeholder="2.5"
                        value={wallHeight}
                        onChange={(e) => setWallHeight(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="brick-type">Tipo de Tijolo (cm)</Label>
                    <Select value={brickType} onValueChange={setBrickType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="9x19x39">9x19x39 cm</SelectItem>
                        <SelectItem value="9x14x39">9x14x39 cm</SelectItem>
                        <SelectItem value="11.5x19x39">11.5x19x39 cm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="brick-waste">Perda (%)</Label>
                    <Input
                      id="brick-waste"
                      type="number"
                      placeholder="10"
                      value={brickWaste}
                      onChange={(e) => setBrickWaste(e.target.value)}
                    />
                  </div>

                  <Button 
                    onClick={calculateBricks}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    Calcular Tijolos
                  </Button>
                </CardContent>
              </Card>

              {results.bricks && (
                <Card>
                  <CardHeader>
                    <CardTitle>Resultado - Tijolos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Área do muro:</span>
                      <span className="font-medium">{results.bricks.wallArea} m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tijolos necessários:</span>
                      <span className="font-medium">{results.bricks.quantity} unidades</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Argamassa:</span>
                      <span className="font-medium">{results.bricks.mortarVolume} m³</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Perda incluída:</span>
                      <span className="font-medium">{results.bricks.wasteIncluded}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Flooring Calculator */}
          <TabsContent value="flooring">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Square className="w-5 h-5 text-blue-600" />
                    <span>Cálculo de Piso</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="floor-width">Largura (m)</Label>
                      <Input
                        id="floor-width"
                        type="number"
                        placeholder="4.0"
                        value={floorWidth}
                        onChange={(e) => setFloorWidth(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="floor-length">Comprimento (m)</Label>
                      <Input
                        id="floor-length"
                        type="number"
                        placeholder="5.0"
                        value={floorLength}
                        onChange={(e) => setFloorLength(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tile-size">Tamanho do Piso (cm)</Label>
                    <Select value={tileSize} onValueChange={setTileSize}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30x30">30x30 cm</SelectItem>
                        <SelectItem value="45x45">45x45 cm</SelectItem>
                        <SelectItem value="60x60">60x60 cm</SelectItem>
                        <SelectItem value="80x80">80x80 cm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="floor-waste">Perda (%)</Label>
                    <Input
                      id="floor-waste"
                      type="number"
                      placeholder="5"
                      value={floorWaste}
                      onChange={(e) => setFloorWaste(e.target.value)}
                    />
                  </div>

                  <Button 
                    onClick={calculateFlooring}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Calcular Piso
                  </Button>
                </CardContent>
              </Card>

              {results.flooring && (
                <Card>
                  <CardHeader>
                    <CardTitle>Resultado - Piso</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Área:</span>
                      <span className="font-medium">{results.flooring.area} m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Área total (com perda):</span>
                      <span className="font-medium">{results.flooring.totalArea} m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Peças necessárias:</span>
                      <span className="font-medium">{results.flooring.tiles} unidades</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Perda incluída:</span>
                      <span className="font-medium">{results.flooring.wasteIncluded}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Paint Calculator */}
          <TabsContent value="paint">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Paintbrush className="w-5 h-5 text-green-600" />
                    <span>Cálculo de Tinta</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="paint-area">Área a pintar (m²)</Label>
                    <Input
                      id="paint-area"
                      type="number"
                      placeholder="50.0"
                      value={paintArea}
                      onChange={(e) => setPaintArea(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="paint-coats">Número de demãos</Label>
                    <Select value={paintCoats} onValueChange={setPaintCoats}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 demão</SelectItem>
                        <SelectItem value="2">2 demãos</SelectItem>
                        <SelectItem value="3">3 demãos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="paint-rendering">Rendimento (m²/L)</Label>
                    <Input
                      id="paint-rendering"
                      type="number"
                      placeholder="12"
                      value={paintRendering}
                      onChange={(e) => setPaintRendering(e.target.value)}
                    />
                  </div>

                  <Button 
                    onClick={calculatePaint}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Calcular Tinta
                  </Button>
                </CardContent>
              </Card>

              {results.paint && (
                <Card>
                  <CardHeader>
                    <CardTitle>Resultado - Tinta</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Área:</span>
                      <span className="font-medium">{results.paint.area} m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Área total ({results.paint.coats} demãos):</span>
                      <span className="font-medium">{results.paint.totalArea} m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tinta necessária:</span>
                      <span className="font-medium">{results.paint.liters} L</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Latas (18L):</span>
                      <span className="font-medium">{results.paint.cans} unidades</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Concrete Calculator */}
          <TabsContent value="concrete">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-gray-600" />
                    <span>Cálculo de Concreto</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="concrete-length">Comprimento (m)</Label>
                      <Input
                        id="concrete-length"
                        type="number"
                        placeholder="10.0"
                        value={concreteLength}
                        onChange={(e) => setConcreteLength(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="concrete-width">Largura (m)</Label>
                      <Input
                        id="concrete-width"
                        type="number"
                        placeholder="0.2"
                        value={concreteWidth}
                        onChange={(e) => setConcreteWidth(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="concrete-thickness">Espessura (cm)</Label>
                    <Input
                      id="concrete-thickness"
                      type="number"
                      placeholder="10"
                      value={concreteThickness}
                      onChange={(e) => setConcreteThickness(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="concrete-ratio">Traço (Cimento:Areia:Brita)</Label>
                    <Select value={concreteRatio} onValueChange={setConcreteRatio}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1:2:3">1:2:3</SelectItem>
                        <SelectItem value="1:2:4">1:2:4</SelectItem>
                        <SelectItem value="1:3:4">1:3:4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={calculateConcrete}
                    className="w-full bg-gray-600 hover:bg-gray-700"
                  >
                    Calcular Concreto
                  </Button>
                </CardContent>
              </Card>

              {results.concrete && (
                <Card>
                  <CardHeader>
                    <CardTitle>Resultado - Concreto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Volume:</span>
                      <span className="font-medium">{results.concrete.volume} m³</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Traço:</span>
                      <span className="font-medium">{results.concrete.ratio}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cimento:</span>
                      <span className="font-medium">{results.concrete.cement} sacos (50kg)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Areia:</span>
                      <span className="font-medium">{results.concrete.sand} m³</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Brita:</span>
                      <span className="font-medium">{results.concrete.gravel} m³</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
