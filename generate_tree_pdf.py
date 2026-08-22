import os
import sys
import datetime
from pathlib import Path

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable, Preformatted
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and render total page count
    and professional running header/footer on every page.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(36, 11 * inch - 26, "Intelligent-Knee-MRI-Assistant — Complete Path Tree & System Specification")
            self.drawRightString(8.5 * inch - 36, 11 * inch - 26, f"{datetime.date.today().strftime('%B %d, %Y')}")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(36, 11 * inch - 30, 8.5 * inch - 36, 11 * inch - 30)
            
        # Footer (all pages)
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(36, 36, 8.5 * inch - 36, 36)
        self.drawString(36, 24, "Folder Path Tree & Architecture Catalog | Generated for Kitten-new")
        self.drawRightString(8.5 * inch - 36, 24, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()


def format_size(size_bytes):
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.2f} MB"


def build_tree_items(target_dir, ignore_dirs=None):
    if ignore_dirs is None:
        ignore_dirs = {'.git', 'venv', 'node_modules'}
    
    items = []
    items.append((f"{os.path.basename(target_dir)}/", True, "", 0))
    
    def _walk(directory, prefix=""):
        try:
            entries = sorted(os.listdir(directory))
        except Exception:
            return
        
        dirs = [e for e in entries if os.path.isdir(os.path.join(directory, e))]
        files = [e for e in entries if not os.path.isdir(os.path.join(directory, e))]
        
        dirs = [d for d in dirs if d not in ignore_dirs]
        all_items = [(d, True) for d in dirs] + [(f, False) for f in files]
        
        for i, (item, is_dir) in enumerate(all_items):
            is_last = (i == len(all_items) - 1)
            connector = "└── " if is_last else "├── "
            full_path = os.path.join(directory, item)
            
            if is_dir:
                display_str = f"{prefix}{connector}{item}/"
                items.append((display_str, True, full_path, 0))
                new_prefix = prefix + ("    " if is_last else "│   ")
                _walk(full_path, new_prefix)
            else:
                sz = os.path.getsize(full_path)
                display_str = f"{prefix}{connector}{item}"
                items.append((display_str, False, full_path, sz))
                
    _walk(target_dir)
    return items


def get_file_inventory(target_dir, ignore_dirs=None):
    if ignore_dirs is None:
        ignore_dirs = {'.git', 'venv', 'node_modules'}
        
    records = []
    for root, dirs, files in os.walk(target_dir):
        rel_root = os.path.relpath(root, target_dir)
        parts = rel_root.split(os.sep) if rel_root != '.' else []
        
        if parts and parts[0] in ignore_dirs:
            continue
            
        for f in sorted(files):
            full_p = os.path.join(root, f)
            rel_p = os.path.relpath(full_p, target_dir)
            sz = os.path.getsize(full_p)
            ext = os.path.splitext(f)[1].lower()
            
            # Classify
            if rel_p.startswith('client'):
                category = 'Frontend (Client)'
            elif rel_p.startswith('server'):
                category = 'Backend (Server)'
            else:
                category = 'Root Config / DevOps'
                
            records.append({
                'name': f,
                'rel_path': rel_p,
                'full_path': full_p,
                'size': sz,
                'size_fmt': format_size(sz),
                'ext': ext,
                'category': category
            })
    return sorted(records, key=lambda x: (x['category'], x['rel_path']))


def generate_pdf(output_pdf_path, target_folder):
    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=40,
        bottomMargin=44
    )
    
    styles = getSampleStyleSheet()
    
    primary_color = colors.HexColor("#0f172a") # Slate 900
    accent_blue = colors.HexColor("#0284c7")   # Sky 600
    dark_gray = colors.HexColor("#334155")     # Slate 700
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=17,
        leading=21,
        textColor=primary_color,
        spaceAfter=3
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=8
    )
    
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=15,
        textColor=primary_color,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )
    
    subsection_heading = ParagraphStyle(
        'SubSectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=12.5,
        textColor=accent_blue,
        spaceBefore=7,
        spaceAfter=2,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=dark_gray
    )
    
    code_path_style = ParagraphStyle(
        'CodePath',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=6.5,
        leading=8,
        textColor=colors.HexColor("#0f172a"),
        wordWrap='CJK'
    )
    
    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9,
        textColor=dark_gray
    )
    
    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.white
    )
    
    tree_line_dir_style = ParagraphStyle(
        'TreeDir',
        parent=styles['Normal'],
        fontName='Courier-Bold',
        fontSize=7.2,
        leading=9,
        textColor=colors.HexColor("#38bdf8")
    )
    
    tree_line_file_style = ParagraphStyle(
        'TreeFile',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.0,
        leading=8.8,
        textColor=colors.HexColor("#e2e8f0")
    )
    
    tree_size_style = ParagraphStyle(
        'TreeSize',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=6.8,
        leading=8.5,
        textColor=colors.HexColor("#94a3b8"),
        alignment=2 # Right aligned
    )

    story = []
    
    # 1. Header Banner Box
    norm_target = os.path.normpath(target_folder)
    
    banner_data = [
        [
            Paragraph("<b>Automated Knee MRI Diagnosis & Interpretation Assistant</b><br/><font size=9 color='#0284c7'><b>Full Directory Hierarchy & Absolute Path Tree Specification</b></font>", title_style)
        ],
        [
            Paragraph(f"<b>Root Path:</b> <font name='Courier' size=7.5>{norm_target}</font><br/>"
                      f"<b>Generated:</b> {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | "
                      f"<b>Platform:</b> Windows 64-bit | <b>Architecture:</b> React 18 (Vite) + Flask + PyTorch MRNet + MongoDB", subtitle_style)
        ]
    ]
    banner_table = Table(banner_data, colWidths=[540])
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 6))
    
    # 2. Executive Summary Metrics Table
    inventory = get_file_inventory(target_folder)
    total_core_files = len(inventory)
    total_core_bytes = sum(item['size'] for item in inventory)
    client_files = [x for x in inventory if x['category'] == 'Frontend (Client)']
    server_files = [x for x in inventory if x['category'] == 'Backend (Server)']
    root_files = [x for x in inventory if x['category'] == 'Root Config / DevOps']
    
    summary_data = [
        [
            Paragraph("<b>Total Core Files</b>", table_cell_style),
            Paragraph("<b>Total Storage</b>", table_cell_style),
            Paragraph("<b>Client (Frontend)</b>", table_cell_style),
            Paragraph("<b>Server (Backend)</b>", table_cell_style),
            Paragraph("<b>Root / DevOps</b>", table_cell_style)
        ],
        [
            Paragraph(f"<font size=9.5 color='#0284c7'><b>{total_core_files} files</b></font>", table_cell_style),
            Paragraph(f"<font size=9.5 color='#0f172a'><b>{format_size(total_core_bytes)}</b></font>", table_cell_style),
            Paragraph(f"<b>{len(client_files)} files</b> ({format_size(sum(x['size'] for x in client_files))})", table_cell_style),
            Paragraph(f"<b>{len(server_files)} files</b> ({format_size(sum(x['size'] for x in server_files))})", table_cell_style),
            Paragraph(f"<b>{len(root_files)} files</b> ({format_size(sum(x['size'] for x in root_files))})", table_cell_style),
        ]
    ]
    summary_table = Table(summary_data, colWidths=[108, 108, 108, 108, 108])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor("#ffffff")),
        ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 8))
    
    # 3. Section 1: Visual Tree Structure as Multi-Row Table (allows natural pagination)
    story.append(Paragraph("1. Hierarchical Directory & File Tree View", section_heading))
    story.append(Paragraph("Visual hierarchy of all source modules, React components, REST endpoints, and assets with per-file byte footprints.", body_style))
    story.append(Spacer(1, 4))
    
    tree_items = build_tree_items(target_folder)
    tree_rows = []
    
    # Header row for tree table
    tree_rows.append([
        Paragraph("<b>Project Folder Tree Structure</b>", table_header_style),
        Paragraph("<b>Footprint</b>", table_header_style)
    ])
    
    for display_str, is_dir, fpath, sz in tree_items:
        # Format display text
        # Convert spaces to non-breaking spaces & clean connectors
        cleaned_display = display_str.replace(" ", "&nbsp;")
        if is_dir:
            cell_p = Paragraph(f"<b>{cleaned_display}</b>", tree_line_dir_style)
            sz_p = Paragraph("<font color='#64748b'>[DIR]</font>", tree_size_style)
        else:
            cell_p = Paragraph(cleaned_display, tree_line_file_style)
            sz_p = Paragraph(f"[{format_size(sz)}]", tree_size_style)
        tree_rows.append([cell_p, sz_p])
        
    tree_table = Table(tree_rows, colWidths=[460, 80], repeatRows=1)
    
    tree_table_style = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#090d16")),
        ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor("#334155")),
        ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.HexColor("#1e293b")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 1.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]
    tree_table.setStyle(TableStyle(tree_table_style))
    story.append(tree_table)
    
    story.append(Spacer(1, 10))
    story.append(PageBreak())
    
    # 4. Section 2: Complete Full Absolute Path Inventory Table
    story.append(Paragraph("2. Complete Full Absolute Path Inventory", section_heading))
    story.append(Paragraph("Complete registry of all project files, showing exact Windows filesystem absolute paths, relative paths, categories, and sizes.", body_style))
    story.append(Spacer(1, 6))
    
    table_headers = [
        Paragraph("<b>#</b>", table_header_style),
        Paragraph("<b>File Name & Subsystem</b>", table_header_style),
        Paragraph("<b>Relative Path</b>", table_header_style),
        Paragraph("<b>Full Absolute File System Path</b>", table_header_style),
        Paragraph("<b>Size</b>", table_header_style)
    ]
    
    inv_rows = [table_headers]
    for idx, item in enumerate(inventory, 1):
        name_cell = Paragraph(f"<b>{item['name']}</b><br/><font size=6 color='#64748b'>{item['category']}</font>", table_cell_style)
        rel_cell = Paragraph(f"<font color='#0369a1'>{item['rel_path']}</font>", code_path_style)
        full_cell = Paragraph(item['full_path'], code_path_style)
        size_cell = Paragraph(item['size_fmt'], table_cell_style)
        num_cell = Paragraph(str(idx), table_cell_style)
        
        inv_rows.append([num_cell, name_cell, rel_cell, full_cell, size_cell])
        
    inv_table = Table(inv_rows, colWidths=[20, 110, 130, 235, 45], repeatRows=1)
    
    ts = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 3.5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3.5),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (4, 0), (4, -1), 'RIGHT'),
    ]
    
    for i in range(1, len(inv_rows)):
        bg = colors.HexColor("#ffffff") if i % 2 == 1 else colors.HexColor("#f8fafc")
        ts.append(('BACKGROUND', (0, i), (-1, i), bg))
        
    inv_table.setStyle(TableStyle(ts))
    story.append(inv_table)
    
    story.append(Spacer(1, 10))
    story.append(PageBreak())
    
    # 5. Section 3: Subsystem Architecture & Responsibilities
    story.append(Paragraph("3. Architectural Subsystem Breakdown", section_heading))
    story.append(Paragraph("Technical specifications and module breakdown of each architectural tier in the codebase.", body_style))
    story.append(Spacer(1, 6))
    
    # Frontend card
    story.append(Paragraph("A. Frontend Client Subsystem (<font name='Courier'>/client</font>)", subsection_heading))
    client_desc = (
        "<b>Framework & Tooling:</b> React 18, Vite Bundler, Tailwind CSS 3, PostCSS, Lucide Icons, Axios.<br/>"
        "<b>Key Directories & Modules:</b><br/>"
        "• <font name='Courier'>src/pages/Admin/AdminPages/</font> - Radiologist portal for MRI ingestion, multi-plane slice viewer, automated diagnosis report compilation (<font name='Courier'>AdminUploads.jsx</font>, <font name='Courier'>Admin_SendReport_Saves.jsx</font>).<br/>"
        "• <font name='Courier'>src/pages/User/UserPages/</font> - Patient consultation and history dashboard (<font name='Courier'>UserSaves.jsx</font>, <font name='Courier'>UserUploads.jsx</font>).<br/>"
        "• <font name='Courier'>src/components/FileUploader/</font> - Drag-and-drop batch directory & multi-plane DICOM/image uploader (<font name='Courier'>FileUploader.jsx</font>, <font name='Courier'>MultipleFolder.jsx</font>).<br/>"
        "• <font name='Courier'>src/context/auth.jsx</font> - Global JWT / session context for authentication and role-based access control."
    )
    story.append(Paragraph(client_desc, body_style))
    story.append(Spacer(1, 8))
    
    # Backend card
    story.append(Paragraph("B. Backend Server Subsystem (<font name='Courier'>/server</font>)", subsection_heading))
    server_desc = (
        "<b>Framework & ML Engine:</b> Python 3.10+, Flask REST API, PyTorch, TorchVision (MRNet), PyMongo, NumPy, Pillow.<br/>"
        "<b>Core Implementation Files:</b><br/>"
        "• <font name='Courier'>server/app.py</font> (34.8 KB) - Core REST gateway handling user auth, ABHA ID patient record linking, MRI file ingestion, and multi-model inference pipelines.<br/>"
        "• <font name='Courier'>server/torch_utils.py</font> (4.3 KB) - PyTorch MRNet deep convolutional network loader and inference utility predicting ACL tears, Meniscus tears, and Abnormalities across Axial, Coronal, and Sagittal planes.<br/>"
        "• <font name='Courier'>server/mongo_config.py</font> - Database connector establishing authenticated MongoDB persistence for scans and diagnostic reports.<br/>"
        "• <font name='Courier'>server/retrive.py</font> - Patient record queries, historical diagnostic report generation, and aggregation.<br/>"
        "• <font name='Courier'>server/abhaData.py</font> - Ayushman Bharat Health Account (ABHA) demographic verification and data lookup."
    )
    story.append(Paragraph(server_desc, body_style))
    story.append(Spacer(1, 8))
    
    # DevOps card
    story.append(Paragraph("C. Containerization & Orchestration", subsection_heading))
    devops_desc = (
        "<b>Docker Environment:</b><br/>"
        "• <font name='Courier'>docker-compose.yml</font> - Multi-container orchestration binding frontend, Flask backend, and MongoDB service on isolated networks.<br/>"
        "• <font name='Courier'>client/Dockerfile.client</font> - Frontend container build spec.<br/>"
        "• <font name='Courier'>server/Dockerfile.server</font> - Flask & PyTorch GPU/CPU server container spec."
    )
    story.append(Paragraph(devops_desc, body_style))
    story.append(Spacer(1, 10))
    
    # 6. Section 4: Environment & Dependency Note
    story.append(Paragraph("4. Environment & Repository Artifacts Summary", section_heading))
    env_summary_data = [
        [
            Paragraph("<b>Virtual Environment (<font name='Courier'>venv/</font>)</b>", table_cell_style),
            Paragraph("Contains <b>24,539 files</b> comprising the Python 3 runtime, PyTorch 2.x, TorchVision, NumPy, SciPy, Pillow, Flask, and Werkzeug distribution packages. Omitted from standard source tree to maintain clarity.", table_cell_style)
        ],
        [
            Paragraph("<b>Git Metadata (<font name='Courier'>.git/</font>)</b>", table_cell_style),
            Paragraph("Contains <b>28 version control objects</b>, commit history, refs, and branch metadata.", table_cell_style)
        ]
    ]
    env_table = Table(env_summary_data, colWidths=[160, 380])
    env_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(env_table)
    
    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF: {output_pdf_path}")

if __name__ == '__main__':
    target = r"C:\Users\PCD\orca\projects\Kitten-new\Knee Abnormality\Intelligent-Knee-MRI-Assistant"
    
    # Output 1: In project folder
    out1 = os.path.join(target, "Intelligent-Knee-MRI-Assistant-Full-Path-Tree.pdf")
    generate_pdf(out1, target)
    
    # Output 2: In workspace root
    out2 = r"C:\Users\PCD\orca\projects\Kitten-new\Intelligent-Knee-MRI-Assistant-Full-Path-Tree.pdf"
    generate_pdf(out2, target)
