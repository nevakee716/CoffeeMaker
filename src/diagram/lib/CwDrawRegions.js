(function (cwDiagramShape, cwApi) {
  "use strict";

  // Load regions inside the shapes and check the properties
  //**Adding draw region shape event */
  cwDiagramShape.prototype.drawRegionZones = function (ctx) {
    if (this.paletteEntry) {
      // Draw all regions
      for (var i = 0; i < this.regions.length; i++) {
        var region = this.regions[i];
        cwApi.pluginManager.execute("CwDiagramViewer.beforeDrawShapeRegion", this, this.shape, region);
        this.drawRegion(ctx, region);
        cwApi.pluginManager.execute("CwDiagramViewer.afterDrawShapeRegion", this, this.shape, region);
      }
      if (this.paletteEntry.HasExplosionRegion === false) {
        // Draw Standard Explosion
        if (!cwApi.isUndefined(this.regions) && this.regions.length > 0 && !cwApi.isUndefined(this.regions[0].explodedDiagrams))
          if (this.regions[0].explodedDiagrams.length > 0) {
            this.drawSymbolPath(ctx, 1, this.regions[0]);
            // Added stroke style to reafirm some places where get lost.
            ctx.strokeStyle = cwApi.CwDiagramDefinitions.StrokeStandardExplosionColor;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
      }
    } else {
      if (this.shape.paletteEntryKey === "OBJECTLINK|0") {
        // Draw part of the Object Link standard own standard explosion region, image and text will be drwan as shape
        if (this.regions.length > 0) {
          this.drawSymbolPath(ctx, 1, this.regions[0]);
          ctx.stroke();
        }
      }
    }
  };
})(cwAPI.Diagrams.CwDiagramShape, cwAPI);
