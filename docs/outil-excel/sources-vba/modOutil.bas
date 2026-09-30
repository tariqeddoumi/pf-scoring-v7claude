Attribute VB_Name = "modOutil"
Option Explicit

' =====================================================================
'  Outil de scoring Project Finance V8 - macros de pilotage
'  Toutes les notes sont calculees par les FORMULES des onglets : les
'  macros ne font que creer, dupliquer, controler, exporter et tracer.
' =====================================================================

Public Const MARQUEUR As String = "DOSSIER_V8"
Public Const ONGLET_MODELE As String = "Modèle"
Public Const ONGLET_SYNTHESE As String = "Synthèse"
Public Const ONGLET_JOURNAL As String = "Journal"
Public Const ONGLET_ACCUEIL As String = "Accueil"
Public Const ONGLET_PARAM As String = "Paramètres"

' ---------------------------------------------------------------------
'  Navigation
' ---------------------------------------------------------------------
Public Sub AllerAccueil()
    ThisWorkbook.Worksheets(ONGLET_ACCUEIL).Activate
End Sub

Public Sub AllerSynthese()
    MajSynthese False
    ThisWorkbook.Worksheets(ONGLET_SYNTHESE).Activate
End Sub

Public Sub AllerParametres()
    ThisWorkbook.Worksheets(ONGLET_PARAM).Activate
End Sub

Public Sub AllerDiagnostic()
    ThisWorkbook.Worksheets("Diagnostic").Activate
End Sub

' ---------------------------------------------------------------------
'  Reconnaissance d'un onglet dossier
' ---------------------------------------------------------------------
Public Function EstDossier(ByVal ws As Worksheet) As Boolean
    On Error Resume Next
    EstDossier = (CStr(ws.Range("J1").Value) = MARQUEUR)
End Function

Private Function NomValide(ByVal nom As String) As Boolean
    Dim interdit As Variant, c As Variant
    NomValide = False
    If Len(nom) = 0 Or Len(nom) > 31 Then
        MsgBox "Le nom doit compter de 1 à 31 caractères.", vbExclamation
        Exit Function
    End If
    interdit = Array(":", "\", "/", "?", "*", "[", "]", "'")
    For Each c In interdit
        If InStr(nom, c) > 0 Then
            MsgBox "Le nom ne peut pas contenir : \ / ? * [ ] ' ou :", vbExclamation
            Exit Function
        End If
    Next c
    If FeuilleExiste(nom) Then
        MsgBox "Un onglet porte déjà le nom « " & nom & " ».", vbExclamation
        Exit Function
    End If
    NomValide = True
End Function

Private Function FeuilleExiste(ByVal nom As String) As Boolean
    Dim ws As Worksheet
    For Each ws In ThisWorkbook.Worksheets
        If StrComp(ws.Name, nom, vbTextCompare) = 0 Then
            FeuilleExiste = True
            Exit Function
        End If
    Next ws
End Function

' ---------------------------------------------------------------------
'  Creation, duplication, suppression
' ---------------------------------------------------------------------
Public Sub NouveauDossier()
    Dim nom As String, wsM As Worksheet, wsN As Worksheet, etatVisible As Long
    nom = Trim$(InputBox("Nom court du nouvel onglet (ex. C6 ou PORT-NADOR) :", "Nouveau dossier"))
    If nom = "" Then Exit Sub
    If Not NomValide(nom) Then Exit Sub

    Application.ScreenUpdating = False
    Set wsM = ThisWorkbook.Worksheets(ONGLET_MODELE)
    etatVisible = wsM.Visible
    wsM.Visible = xlSheetVisible
    wsM.Copy Before:=wsM
    Set wsN = ThisWorkbook.Worksheets(wsM.Index - 1)
    wsN.Name = nom
    wsN.Range("J1").Value = MARQUEUR
    wsN.Range("A1").Value = "Nouveau dossier " & nom
    wsM.Visible = etatVisible
    Application.ScreenUpdating = True

    MajSynthese False
    Journaliser "Création", nom, "Dossier créé à partir du modèle vierge"
    wsN.Activate
    wsN.Range("B15").Select
    MsgBox "Dossier « " & nom & " » créé." & vbCrLf & _
           "Renseignez les cellules jaunes, de haut en bas : routage, sources et emplois," & vbCrLf & _
           "échéancier, noyau financier, grille, plafonds et verrous." & vbCrLf & _
           "La note se met à jour à chaque saisie.", vbInformation, "Nouveau dossier"
End Sub

Public Sub DupliquerDossier()
    Dim ws As Worksheet, nom As String, wsN As Worksheet
    Set ws = ActiveSheet
    If Not EstDossier(ws) Then
        MsgBox "Placez-vous d'abord sur l'onglet du dossier à dupliquer.", vbExclamation
        Exit Sub
    End If
    nom = Trim$(InputBox("Nom du nouvel onglet (copie de « " & ws.Name & " ») :", "Dupliquer", ws.Name & "-v2"))
    If nom = "" Then Exit Sub
    If Not NomValide(nom) Then Exit Sub
    Application.ScreenUpdating = False
    ws.Copy After:=ws
    Set wsN = ThisWorkbook.Worksheets(ws.Index + 1)
    wsN.Name = nom
    Application.ScreenUpdating = True
    MajSynthese False
    Journaliser "Duplication", nom, "Copie de " & ws.Name
    wsN.Activate
End Sub

Public Sub SupprimerDossier()
    Dim ws As Worksheet, nom As String
    Set ws = ActiveSheet
    If Not EstDossier(ws) Then
        MsgBox "Placez-vous d'abord sur l'onglet du dossier à supprimer.", vbExclamation
        Exit Sub
    End If
    nom = ws.Name
    If MsgBox("Supprimer définitivement le dossier « " & nom & " » ?" & vbCrLf & _
              "Cette action est irréversible.", vbYesNo + vbExclamation + vbDefaultButton2, "Supprimer") <> vbYes Then Exit Sub
    Application.DisplayAlerts = False
    ws.Delete
    Application.DisplayAlerts = True
    MajSynthese False
    Journaliser "Suppression", nom, ""
    ThisWorkbook.Worksheets(ONGLET_SYNTHESE).Activate
End Sub

' ---------------------------------------------------------------------
'  Synthese : une colonne par onglet dossier, formules INDIRECT
' ---------------------------------------------------------------------
Public Sub MajSynthese(Optional ByVal avecMessage As Boolean = True)
    Dim wsS As Worksheet, ws As Worksheet, col As Long, derniere As Long
    Set wsS = ThisWorkbook.Worksheets(ONGLET_SYNTHESE)
    derniere = wsS.Cells(wsS.Rows.Count, "Z").End(xlUp).Row
    Application.ScreenUpdating = False
    wsS.Range(wsS.Cells(4, 2), wsS.Cells(derniere, 24)).ClearContents
    col = 2
    For Each ws In ThisWorkbook.Worksheets
        If EstDossier(ws) Then
            If col > 24 Then Exit For
            wsS.Cells(4, col).Value = ws.Name
            col = col + 1
        End If
    Next ws
    If col > 2 Then
        wsS.Range(wsS.Cells(5, 2), wsS.Cells(derniere, col - 1)).FormulaR1C1 = _
            "=IF(R4C="""","""",IFERROR(INDIRECT(""'""&R4C&""'!""&RC26),""""))"
    End If
    Application.Calculate
    Application.ScreenUpdating = True
    If avecMessage Then MsgBox (col - 2) & " dossier(s) dans la synthèse.", vbInformation, "Synthèse"
End Sub

' Point d'entrée des boutons : une macro liée à un bouton ne prend pas d'argument.
Public Sub MettreAJourSynthese()
    MajSynthese True
End Sub

' ---------------------------------------------------------------------
'  Recalcul complet et controle de saisie du dossier actif
' ---------------------------------------------------------------------
Public Sub Recalculer()
    Application.CalculateFull
    MajSynthese False
    MsgBox "Recalcul terminé. La synthèse est à jour.", vbInformation, "Recalcul"
End Sub

Public Sub ControlerDossier()
    Dim ws As Worksheet, msg As String, r As Long, nb As Long, premier As Range
    Set ws = ActiveSheet
    If Not EstDossier(ws) Then
        MsgBox "Placez-vous sur l'onglet d'un dossier.", vbExclamation
        Exit Sub
    End If
    Application.Calculate

    AjouterSiVide ws, "B15", "Régime de revenus", msg, premier
    AjouterSiVide ws, "B16", "Secteur", msg, premier
    AjouterSiVide ws, "B17", "Phase", msg, premier
    AjouterSiVide ws, "B23", "Exposition de la banque", msg, premier
    AjouterSiVide ws, "B70", "Choc de stress (scénario défavorable)", msg, premier

    nb = Application.WorksheetFunction.Count(ws.Range("B72:B131"))
    If nb < 2 Then msg = msg & "- Échéancier : moins de deux périodes renseignées." & vbCrLf
    For r = 72 To 131
        ' Comparaisons faites sur le texte : une valeur numérique comparée à "" provoque
        ' une incompatibilité de type en VBA.
        If Len(Trim$(CStr(ws.Cells(r, 2).Value))) > 0 And Len(Trim$(CStr(ws.Cells(r, 3).Value))) = 0 Then
            msg = msg & "- Période ligne " & r & " : CFADS sans service de la dette." & vbCrLf
        End If
        If Len(Trim$(CStr(ws.Cells(r, 2).Value))) > 0 Then
            If IsNumeric(ws.Cells(r, 2).Value) Then
                If CDbl(ws.Cells(r, 2).Value) < 0 Then msg = msg & "- Période ligne " & r & " : CFADS négatif (N1 noté Critique)." & vbCrLf
            End If
        End If
    Next r

    For r = 145 To 147
        AjouterSiVide ws, "B" & r, "Noyau " & ws.Cells(r, 1).Value, msg, premier
    Next r
    If CStr(ws.Range("B17").Value) <> "P1" Then AjouterSiVide ws, "B150", "N3 hors phase P1 (LLCR)", msg, premier
    AjouterSiVide ws, "B152", "DSRA en mois de service", msg, premier
    AjouterSiVide ws, "B153", "Exposition nette en devises", msg, premier

    For r = 169 To 201
        If CStr(ws.Cells(r, 10).Value) = "SC" And CStr(ws.Cells(r, 11).Value) = "1" Then
            If Not IsNumeric(ws.Cells(r, 2).Value) Or Trim$(CStr(ws.Cells(r, 2).Value)) = "" Then
                msg = msg & "- Grille : " & Trim$(ws.Cells(r, 1).Value) & " non noté." & vbCrLf
                If premier Is Nothing Then Set premier = ws.Cells(r, 2)
            End If
        End If
    Next r

    If msg = "" Then
        MsgBox "Aucune donnée manquante détectée." & vbCrLf & vbCrLf & _
               "Note approuvée : " & ws.Range("B6").Text & "   (" & ws.Range("D6").Text & ")" & vbCrLf & _
               "Plafonds actifs : " & ws.Range("B8").Text, vbInformation, "Contrôle du dossier " & ws.Name
    Else
        MsgBox "Points à compléter :" & vbCrLf & vbCrLf & msg, vbExclamation, "Contrôle du dossier " & ws.Name
        If Not premier Is Nothing Then premier.Select
    End If
    Journaliser "Contrôle", ws.Name, IIf(msg = "", "Complet", "Incomplet")
End Sub

Private Sub AjouterSiVide(ByVal ws As Worksheet, ByVal adr As String, ByVal libelle As String, _
                          ByRef msg As String, ByRef premier As Range)
    If Trim$(CStr(ws.Range(adr).Value)) = "" Then
        msg = msg & "- " & libelle & " (" & adr & ")" & vbCrLf
        If premier Is Nothing Then Set premier = ws.Range(adr)
    End If
End Sub

' ---------------------------------------------------------------------
'  Export PDF de la fiche du dossier actif
' ---------------------------------------------------------------------
Public Sub ExporterPDF()
    Dim ws As Worksheet, chemin As String
    Set ws = ActiveSheet
    If Not EstDossier(ws) And ws.Name <> ONGLET_SYNTHESE Then
        MsgBox "Placez-vous sur un dossier ou sur la synthèse.", vbExclamation
        Exit Sub
    End If
    If ThisWorkbook.Path = "" Then
        MsgBox "Enregistrez d'abord le classeur : le PDF est créé dans le même dossier.", vbExclamation
        Exit Sub
    End If
    chemin = ThisWorkbook.Path & Application.PathSeparator & "Fiche_" & ws.Name & "_" & Format(Now, "yyyymmdd_hhnn") & ".pdf"
    ws.ExportAsFixedFormat Type:=xlTypePDF, Filename:=chemin, Quality:=xlQualityStandard, _
                           IncludeDocProperties:=True, IgnorePrintAreas:=False, OpenAfterPublish:=True
    Journaliser "Export PDF", ws.Name, chemin
End Sub

' ---------------------------------------------------------------------
'  Journal des actions
' ---------------------------------------------------------------------
Public Sub Journaliser(ByVal action As String, ByVal dossier As String, ByVal detail As String)
    Dim wsJ As Worksheet, r As Long
    On Error GoTo Fin
    Set wsJ = ThisWorkbook.Worksheets(ONGLET_JOURNAL)
    r = wsJ.Cells(wsJ.Rows.Count, 1).End(xlUp).Row + 1
    If r < 5 Then r = 5
    wsJ.Cells(r, 1).Value = Now
    wsJ.Cells(r, 1).NumberFormat = "dd/mm/yyyy hh:mm"
    wsJ.Cells(r, 2).Value = Application.UserName
    wsJ.Cells(r, 3).Value = action
    wsJ.Cells(r, 4).Value = dossier
    wsJ.Cells(r, 5).Value = detail
Fin:
End Sub
