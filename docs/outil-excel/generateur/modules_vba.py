# -*- coding: utf-8 -*-
"""Sources VBA de l'outil de scoring PF V8, version 2 (encodage cp1252 : pas de symbole hors Windows-1252).

Les adresses entre accolades ({P_FIRST}, {CK_FIRST}...) sont remplacées à la construction
par celles de la mise en page du dossier (build_tool.R).
"""

MOD_OUTIL = r'''Option Explicit

' =====================================================================
'  Outil de scoring Project Finance V8 - version 2 - macros de pilotage
'  Toutes les notes sont calculees par les FORMULES des onglets : les
'  macros creent, dupliquent, controlent, preparent l'echeancier,
'  exportent et tracent. Les feuilles sont protegees SANS mot de passe.
' =====================================================================

Public Const MARQUEUR As String = "DOSSIER_V8"
Public Const MARQUEUR_MODELE As String = "MODELE"
Public Const ONGLET_MODELE As String = "Modèle"
Public Const ONGLET_SYNTHESE As String = "Synthèse"
Public Const ONGLET_FICHE As String = "Fiche comité"
Public Const ONGLET_JOURNAL As String = "Journal"
Public Const ONGLET_ACCUEIL As String = "Accueil"
Public Const ONGLET_PARAM As String = "Paramètres"
Public Const ONGLET_DIAG As String = "Diagnostic"

Private Const LIGNE_P1 As Long = {P_FIRST}
Private Const LIGNE_PN As Long = {P_LAST}
Private Const CK_PREMIERE As Long = {CK_FIRST}
Private Const CK_DERNIERE As Long = {CK_LAST}
Private Const MAX_DOSSIERS As Long = 23
Private Const MAX_LIGNES_MSG As Long = 12

' ---------------------------------------------------------------------
'  Utilitaires
' ---------------------------------------------------------------------
' Texte d'une valeur de cellule, sans erreur d'execution sur #N/A, #DIV/0!...
Public Function Txt(ByVal v As Variant) As String
    If IsError(v) Then
        Txt = "#ERREUR"
    ElseIf IsEmpty(v) Then
        Txt = ""
    Else
        Txt = Trim$(CStr(v))
    End If
End Function

Private Function EstNombre(ByVal v As Variant) As Boolean
    If IsError(v) Or IsEmpty(v) Then Exit Function
    Select Case VarType(v)
        Case vbDouble, vbSingle, vbInteger, vbLong, vbCurrency, vbDecimal
            EstNombre = True
    End Select
End Function

' Protection sans mot de passe. UserInterfaceOnly laisse les macros ecrire
' tout en empechant l'utilisateur d'ecraser une formule.
Public Sub Proteger(ByVal ws As Worksheet)
    On Error Resume Next
    ws.Protect Password:="", DrawingObjects:=True, Contents:=True, Scenarios:=True, _
               UserInterfaceOnly:=True, AllowFormattingColumns:=True, AllowFormattingRows:=True, _
               AllowSorting:=True, AllowFiltering:=True
End Sub

Public Sub ProtegerTout()
    Dim ws As Worksheet
    For Each ws In ThisWorkbook.Worksheets
        Proteger ws
    Next ws
End Sub

Private Sub Activer(ByVal nom As String)
    On Error GoTo Absent
    ThisWorkbook.Worksheets(nom).Activate
    Exit Sub
Absent:
    MsgBox "Onglet « " & nom & " » introuvable.", vbExclamation
End Sub

' ---------------------------------------------------------------------
'  Navigation
' ---------------------------------------------------------------------
Public Sub AllerAccueil()
    Activer ONGLET_ACCUEIL
End Sub

Public Sub AllerSynthese()
    MajSynthese False
    Activer ONGLET_SYNTHESE
End Sub

Public Sub AllerParametres()
    Activer ONGLET_PARAM
End Sub

Public Sub AllerDiagnostic()
    Activer ONGLET_DIAG
End Sub

Public Sub AllerJournal()
    Activer ONGLET_JOURNAL
End Sub

' ---------------------------------------------------------------------
'  Reconnaissance d'un onglet dossier
' ---------------------------------------------------------------------
' Un dossier porte DOSSIER_V8 en J1 (colonne masquee). Une copie faite a la
' main depuis le Modele (MODELE en J1) est aussi reconnue.
Public Function EstDossier(ByVal ws As Object) As Boolean
    Dim m As String
    On Error GoTo Non
    If TypeName(ws) <> "Worksheet" Then Exit Function
    m = Txt(ws.Range("J1").Value)
    If m = MARQUEUR Then
        EstDossier = True
    ElseIf m = MARQUEUR_MODELE And ws.Name <> ONGLET_MODELE Then
        EstDossier = True
    End If
    Exit Function
Non:
    EstDossier = False
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

Private Function ListeDossiers() As String
    Dim ws As Worksheet, s As String
    For Each ws In ThisWorkbook.Worksheets
        If EstDossier(ws) Then
            If s <> "" Then s = s & ", "
            s = s & ws.Name
        End If
    Next ws
    ListeDossiers = "Dossiers existants : " & s
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

' Dossier vise par une action : l'onglet actif s'il s'agit d'un dossier, sinon
' le nom demande a l'utilisateur. Renvoie Nothing si l'action est abandonnee.
Private Function DossierCible(ByVal titre As String) As Worksheet
    Dim nom As String
    If EstDossier(ActiveSheet) Then
        Set DossierCible = ActiveSheet
        Exit Function
    End If
    nom = Trim$(InputBox("Nom de l'onglet du dossier :" & vbCrLf & vbCrLf & ListeDossiers(), titre))
    If nom = "" Then Exit Function
    If Not FeuilleExiste(nom) Then
        MsgBox "Aucun onglet ne porte le nom « " & nom & " ».", vbExclamation, titre
        Exit Function
    End If
    If Not EstDossier(ThisWorkbook.Worksheets(nom)) Then
        MsgBox "« " & nom & " » n'est pas un onglet de dossier.", vbExclamation, titre
        Exit Function
    End If
    Set DossierCible = ThisWorkbook.Worksheets(nom)
End Function

Private Function DossierActif(ByVal titre As String) As Worksheet
    If EstDossier(ActiveSheet) Then
        Set DossierActif = ActiveSheet
    Else
        MsgBox "Placez-vous d'abord sur l'onglet d'un dossier.", vbExclamation, titre
    End If
End Function

' ---------------------------------------------------------------------
'  Creation, duplication, suppression
' ---------------------------------------------------------------------
Public Sub NouveauDossier()
    Dim nom As String, intitule As String, wsM As Worksheet, wsN As Worksheet, etat As Long
    nom = Trim$(InputBox("Nom court du nouvel onglet (ex. C6 ou PORT-NADOR) :", "Nouveau dossier (1/2)"))
    If nom = "" Then Exit Sub
    If Not NomValide(nom) Then Exit Sub
    intitule = Trim$(InputBox("Intitulé du projet (facultatif, modifiable ensuite en A1) :", "Nouveau dossier (2/2)"))

    On Error GoTo Echec
    Application.ScreenUpdating = False
    Set wsM = ThisWorkbook.Worksheets(ONGLET_MODELE)
    etat = wsM.Visible
    wsM.Visible = xlSheetVisible
    wsM.Copy Before:=wsM
    Set wsN = ActiveSheet
    wsM.Visible = etat
    wsN.Name = nom
    Proteger wsN
    wsN.Range("J1").Value = MARQUEUR
    If intitule <> "" Then
        wsN.Range("A1").Value = intitule
    Else
        wsN.Range("A1").Value = "Nouveau dossier " & nom
    End If
    Application.ScreenUpdating = True

    MajSynthese False
    Journaliser "Création", nom, "Dossier créé à partir du modèle vierge"
    wsN.Activate
    Application.Goto wsN.Range("B{REGIME}"), True
    MsgBox "Dossier « " & nom & " » créé." & vbCrLf & vbCrLf & _
           "1. Remplissez les cellules ORANGE (saisies obligatoires), de haut en bas." & vbCrLf & _
           "2. La ligne « À SAISIR » en haut indique la prochaine saisie et donne un lien pour y aller." & vbCrLf & _
           "3. Sélectionnez une cellule pour afficher son aide.", vbInformation, "Nouveau dossier"
    Exit Sub
Echec:
    Application.ScreenUpdating = True
    MsgBox "Création impossible : " & Err.Description, vbExclamation, "Nouveau dossier"
End Sub

Public Sub DupliquerDossier()
    Dim ws As Worksheet, nom As String, wsN As Worksheet
    Set ws = DossierCible("Dupliquer un dossier")
    If ws Is Nothing Then Exit Sub
    nom = Trim$(InputBox("Nom du nouvel onglet (copie de « " & ws.Name & " ») :", "Dupliquer un dossier", Left$(ws.Name, 28) & "-v2"))
    If nom = "" Then Exit Sub
    If Not NomValide(nom) Then Exit Sub

    On Error GoTo Echec
    Application.ScreenUpdating = False
    ws.Copy After:=ws
    Set wsN = ActiveSheet
    wsN.Name = nom
    Proteger wsN
    wsN.Range("J1").Value = MARQUEUR
    Application.ScreenUpdating = True
    MajSynthese False
    Journaliser "Duplication", nom, "Copie de " & ws.Name
    wsN.Activate
    MsgBox "Copie « " & nom & " » créée : modifiez-la pour tester une variante (montage, stress, couverture...).", _
           vbInformation, "Dupliquer un dossier"
    Exit Sub
Echec:
    Application.ScreenUpdating = True
    MsgBox "Duplication impossible : " & Err.Description, vbExclamation, "Dupliquer un dossier"
End Sub

Public Sub SupprimerDossier()
    Dim ws As Worksheet, nom As String
    Set ws = DossierCible("Supprimer un dossier")
    If ws Is Nothing Then Exit Sub
    nom = ws.Name
    If MsgBox("Supprimer définitivement le dossier « " & nom & " » ?" & vbCrLf & _
              "Cette action est irréversible.", vbYesNo + vbExclamation + vbDefaultButton2, "Supprimer un dossier") <> vbYes Then Exit Sub
    Application.DisplayAlerts = False
    ws.Delete
    Application.DisplayAlerts = True
    MajSynthese False
    Journaliser "Suppression", nom, ""
    Activer ONGLET_ACCUEIL
End Sub

' ---------------------------------------------------------------------
'  Synthese : la ligne 4 recoit le nom des onglets dossiers ; les formules
'  (INDIRECT) des lignes suivantes lisent chaque dossier.
' ---------------------------------------------------------------------
Public Sub MajSynthese(Optional ByVal avecMessage As Boolean = True)
    Dim wsS As Worksheet, ws As Worksheet, col As Long, nb As Long, trop As Long
    On Error GoTo Echec
    Set wsS = ThisWorkbook.Worksheets(ONGLET_SYNTHESE)
    Proteger wsS
    Application.ScreenUpdating = False
    wsS.Range(wsS.Cells(4, 2), wsS.Cells(4, 1 + MAX_DOSSIERS)).ClearContents
    col = 2
    For Each ws In ThisWorkbook.Worksheets
        If EstDossier(ws) Then
            If col <= 1 + MAX_DOSSIERS Then
                ' apostrophe : un nom comme 2026 ou VRAI reste du texte
                wsS.Cells(4, col).Value = "'" & ws.Name
                col = col + 1
            Else
                trop = trop + 1
            End If
        End If
    Next ws
    nb = col - 2
    Application.Calculate
    Application.ScreenUpdating = True
    If avecMessage Then
        If trop > 0 Then
            MsgBox nb & " dossier(s) dans la synthèse ; " & trop & " dossier(s) au-delà de " & MAX_DOSSIERS & _
                   " ne sont pas affichés.", vbExclamation, "Synthèse"
        Else
            MsgBox nb & " dossier(s) dans la synthèse.", vbInformation, "Synthèse"
        End If
    End If
    Exit Sub
Echec:
    Application.ScreenUpdating = True
    If avecMessage Then MsgBox "Mise à jour de la synthèse impossible : " & Err.Description, vbExclamation, "Synthèse"
End Sub

' Point d'entree des boutons : une macro liee a un bouton ne prend pas d'argument.
Public Sub MettreAJourSynthese()
    MajSynthese True
End Sub

Public Sub Recalculer()
    Application.CalculateFull
    MajSynthese False
    MsgBox "Recalcul terminé. La synthèse est à jour.", vbInformation, "Recalcul"
End Sub

' ---------------------------------------------------------------------
'  Controle de saisie : lit la check-list du dossier (colonnes P:R masquees),
'  la meme que celle de la ligne « A SAISIR ».
' ---------------------------------------------------------------------
Public Sub ControlerDossier()
    Dim ws As Worksheet, msg As String, attention As String, texte As String
    Dim r As Long, nb As Long, nbAtt As Long, premier As Range, adr As String, nr As Long
    Set ws = DossierActif("Contrôler la saisie")
    If ws Is Nothing Then Exit Sub
    Application.Calculate

    For r = CK_PREMIERE To CK_DERNIERE
        If Txt(ws.Cells(r, 18).Value) <> "1" Then
            nb = nb + 1
            adr = Txt(ws.Cells(r, 17).Value)
            If nb <= MAX_LIGNES_MSG Then msg = msg & "- " & Txt(ws.Cells(r, 16).Value) & "   (" & adr & ")" & vbCrLf
            If premier Is Nothing Then
                On Error Resume Next
                Set premier = ws.Range(adr)
                On Error GoTo 0
            End If
        End If
    Next r
    If nb > MAX_LIGNES_MSG Then msg = msg & "... et " & (nb - MAX_LIGNES_MSG) & " autre(s)." & vbCrLf

    For r = LIGNE_P1 To LIGNE_PN
        If EstNombre(ws.Cells(r, 2).Value) Then
            If ws.Cells(r, 2).Value < 0 Then
                nbAtt = nbAtt + 1
                If nbAtt <= 6 Then attention = attention & "- " & Txt(ws.Cells(r, 1).Value) & " : CFADS négatif (N1 noté Critique)." & vbCrLf
            End If
        End If
        If Txt(ws.Cells(r, 5).Value) = "Différé" Then
            nbAtt = nbAtt + 1
            If nbAtt <= 6 Then attention = attention & "- " & Txt(ws.Cells(r, 1).Value) & " : période de différé, exclue du DSCR." & vbCrLf
        End If
    Next r
    nr = Application.WorksheetFunction.CountIf(ws.Range("E{C_FIRST}:E{C_LAST}"), "n.r.")
    If nr > 0 Then attention = attention & "- " & nr & " plafond(s) non évalué(s) faute de donnée (section 11)." & vbCrLf

    If nb = 0 Then
        texte = "Toutes les saisies obligatoires sont faites." & vbCrLf & vbCrLf & _
                "Note approuvée : " & ws.Range("B6").Text & "   (" & ws.Range("D6").Text & ")" & vbCrLf & _
                "Statut : " & ws.Range("F6").Text & vbCrLf & _
                "Plafonds actifs : " & ws.Range("B8").Text
        If attention <> "" Then texte = texte & vbCrLf & vbCrLf & "Points d'attention :" & vbCrLf & attention
        texte = texte & vbCrLf & vbCrLf & "Étape suivante : bouton « Fiche comité »."
        MsgBox texte, vbInformation, "Contrôle du dossier " & ws.Name
    Else
        texte = nb & " saisie(s) obligatoire(s) manquante(s) :" & vbCrLf & vbCrLf & msg
        If attention <> "" Then texte = texte & vbCrLf & "Points d'attention :" & vbCrLf & attention
        texte = texte & vbCrLf & "Le curseur va sur la première cellule à remplir (en orange)."
        MsgBox texte, vbExclamation, "Contrôle du dossier " & ws.Name
        If Not premier Is Nothing Then Application.Goto premier
    End If
    Journaliser "Contrôle", ws.Name, IIf(nb = 0, "Complet", nb & " saisie(s) manquante(s)")
End Sub

' ---------------------------------------------------------------------
'  Echeancier : libelles des periodes, effacement
' ---------------------------------------------------------------------
Public Sub PreparerEcheancier()
    Dim ws As Worksheet, per As String, parAn As Long, suffixe As String
    Dim rep As String, nbAns As Long, n As Long, i As Long, defaut As Long, maxi As Long
    Set ws = DossierActif("Préparer l'échéancier")
    If ws Is Nothing Then Exit Sub

    per = Txt(ws.Range("B{PERIOD}").Value)
    If per = "" Then per = "Semestrielle"
    Select Case per
        Case "Trimestrielle"
            parAn = 4: suffixe = "T"
        Case "Mensuelle"
            parAn = 12: suffixe = "M"
        Case Else
            parAn = 2: suffixe = "S"
    End Select
    maxi = LIGNE_PN - LIGNE_P1 + 1

    defaut = 10
    If EstNombre(ws.Range("B{DUREE}").Value) Then
        If ws.Range("B{DUREE}").Value >= 1 Then defaut = CLng(ws.Range("B{DUREE}").Value)
    End If
    rep = Trim$(InputBox("Nombre d'années de remboursement :" & vbCrLf & vbCrLf & _
                         "Périodicité « " & per & " » : " & parAn & " échéance(s) par an, " & maxi & " périodes au plus.", _
                         "Préparer l'échéancier", CStr(defaut)))
    If rep = "" Then Exit Sub
    If Not IsNumeric(rep) Then
        MsgBox "Saisissez un nombre d'années.", vbExclamation, "Préparer l'échéancier"
        Exit Sub
    End If
    nbAns = CLng(rep)
    If nbAns < 1 Then
        MsgBox "Saisissez au moins une année.", vbExclamation, "Préparer l'échéancier"
        Exit Sub
    End If
    n = nbAns * parAn
    If n > maxi Then
        n = maxi
        MsgBox "L'échéancier compte au plus " & maxi & " périodes : seules les " & maxi & " premières sont préparées.", _
               vbInformation, "Préparer l'échéancier"
    End If
    If Application.WorksheetFunction.CountA(ws.Range("A" & LIGNE_P1 & ":C" & LIGNE_PN)) > 0 Then
        If MsgBox("L'échéancier contient déjà des saisies." & vbCrLf & _
                  "Remplacer les libellés de période ? Les montants saisis sont conservés.", _
                  vbYesNo + vbQuestion, "Préparer l'échéancier") <> vbYes Then Exit Sub
    End If

    Proteger ws
    Application.ScreenUpdating = False
    If Txt(ws.Range("B{PERIOD}").Value) = "" Then ws.Range("B{PERIOD}").Value = per
    ws.Range("A" & LIGNE_P1 & ":A" & LIGNE_PN).ClearContents
    For i = 0 To n - 1
        If suffixe = "M" Then
            ws.Cells(LIGNE_P1 + i, 1).Value = "An " & (i \ parAn + 1) & " · M" & Format((i Mod parAn) + 1, "00")
        Else
            ws.Cells(LIGNE_P1 + i, 1).Value = "An " & (i \ parAn + 1) & " · " & suffixe & ((i Mod parAn) + 1)
        End If
    Next i
    Application.ScreenUpdating = True
    Application.Goto ws.Range("B" & LIGNE_P1), True
    Journaliser "Échéancier préparé", ws.Name, n & " périodes (" & per & ")"
    MsgBox n & " périodes préparées." & vbCrLf & vbCrLf & _
           "Saisissez pour chacune le CFADS central (colonne B) et le service de la dette (colonne C). " & _
           "Le CFADS stressé (colonne F) est facultatif.", vbInformation, "Préparer l'échéancier"
End Sub

Public Sub EffacerEcheancier()
    Dim ws As Worksheet
    Set ws = DossierActif("Effacer l'échéancier")
    If ws Is Nothing Then Exit Sub
    If MsgBox("Effacer toutes les périodes de l'échéancier de « " & ws.Name & " » ?" & vbCrLf & _
              "(libellés, CFADS central, service de la dette, CFADS stressé)", _
              vbYesNo + vbExclamation + vbDefaultButton2, "Effacer l'échéancier") <> vbYes Then Exit Sub
    Proteger ws
    ws.Range("A" & LIGNE_P1 & ":C" & LIGNE_PN).ClearContents
    ws.Range("F" & LIGNE_P1 & ":F" & LIGNE_PN).ClearContents
    Journaliser "Échéancier effacé", ws.Name, ""
    Application.Goto ws.Range("A" & LIGNE_P1), True
End Sub

' ---------------------------------------------------------------------
'  Fiche comite
' ---------------------------------------------------------------------
Public Sub OuvrirFiche()
    Dim wsF As Worksheet, nom As String
    If EstDossier(ActiveSheet) Then nom = ActiveSheet.Name
    MajSynthese False
    Set wsF = ThisWorkbook.Worksheets(ONGLET_FICHE)
    If nom <> "" Then
        Proteger wsF
        wsF.Range("B4").Value = "'" & nom
        Application.Calculate
    End If
    wsF.Activate
    wsF.Range("B4").Select
End Sub

Public Sub AllerDossierFiche()
    Dim nom As String
    nom = Txt(ThisWorkbook.Worksheets(ONGLET_FICHE).Range("B4").Value)
    If nom = "" Or Not FeuilleExiste(nom) Then
        MsgBox "Choisissez d'abord un dossier dans la cellule B4.", vbExclamation, "Fiche comité"
        Exit Sub
    End If
    ThisWorkbook.Worksheets(nom).Activate
End Sub

' ---------------------------------------------------------------------
'  Export PDF de l'onglet actif (dossier, synthese ou fiche comite)
' ---------------------------------------------------------------------
Public Sub ExporterPDF()
    Dim ws As Worksheet, chemin As Variant, dossier As String, nomFichier As String, sujet As String
    Set ws = ActiveSheet
    If Not EstDossier(ws) And ws.Name <> ONGLET_SYNTHESE And ws.Name <> ONGLET_FICHE Then
        MsgBox "Placez-vous sur un dossier, sur la fiche comité ou sur la synthèse.", vbExclamation, "Exporter en PDF"
        Exit Sub
    End If
    If ws.Name = ONGLET_FICHE Then
        sujet = "Fiche_comite_" & Txt(ws.Range("B4").Value)
    ElseIf ws.Name = ONGLET_SYNTHESE Then
        sujet = "Synthese"
    Else
        sujet = "Dossier_" & ws.Name
    End If
    nomFichier = sujet & "_" & Format(Now, "yyyymmdd_hhnn") & ".pdf"
    ' Classeur ouvert depuis OneDrive ou SharePoint : son chemin est une adresse web.
    dossier = ThisWorkbook.Path
    If dossier = "" Or LCase$(Left$(dossier, 4)) = "http" Then dossier = CurDir$
    chemin = Application.GetSaveAsFilename(InitialFileName:=dossier & Application.PathSeparator & nomFichier, _
                                           FileFilter:="Fichier PDF (*.pdf), *.pdf", Title:="Exporter en PDF")
    If VarType(chemin) = vbBoolean Then Exit Sub
    On Error GoTo Echec
    ws.ExportAsFixedFormat Type:=xlTypePDF, Filename:=CStr(chemin), Quality:=xlQualityStandard, _
                           IncludeDocProperties:=True, IgnorePrintAreas:=False, OpenAfterPublish:=True
    Journaliser "Export PDF", ws.Name, CStr(chemin)
    Exit Sub
Echec:
    MsgBox "Export impossible : " & Err.Description & vbCrLf & _
           "Vérifiez que le fichier n'est pas déjà ouvert et que le dossier est accessible.", vbExclamation, "Exporter en PDF"
End Sub

' ---------------------------------------------------------------------
'  Journal des actions
' ---------------------------------------------------------------------
Public Sub Journaliser(ByVal action As String, ByVal dossier As String, ByVal detail As String)
    Dim wsJ As Worksheet, r As Long
    On Error GoTo Fin
    Set wsJ = ThisWorkbook.Worksheets(ONGLET_JOURNAL)
    Proteger wsJ
    r = wsJ.Cells(wsJ.Rows.Count, 1).End(xlUp).Row + 1
    If r < 5 Then r = 5
    wsJ.Cells(r, 1).Value = Now
    wsJ.Cells(r, 1).NumberFormat = "dd/mm/yyyy hh:mm"
    wsJ.Cells(r, 2).Value = Application.UserName
    wsJ.Cells(r, 3).Value = action
    wsJ.Cells(r, 4).Value = "'" & dossier
    wsJ.Cells(r, 5).Value = detail
Fin:
End Sub
'''

THIS_WORKBOOK = r'''Option Explicit

Private Sub Workbook_Open()
    On Error Resume Next
    modOutil.ProtegerTout
    Application.Calculate
    modOutil.MajSynthese False
    Me.Worksheets(modOutil.ONGLET_ACCUEIL).Activate
End Sub

' Trace des changements de routage : ils modifient les seuils et les poids.
Private Sub Workbook_SheetChange(ByVal Sh As Object, ByVal Target As Range)
    On Error GoTo Fin
    If Not modOutil.EstDossier(Sh) Then Exit Sub
    If Not Intersect(Target, Sh.Range("B{REGIME}:B{PHASE}")) Is Nothing Then
        modOutil.Journaliser "Routage modifié", Sh.Name, _
            modOutil.Txt(Sh.Range("B{REGIME}").Value) & " / " & modOutil.Txt(Sh.Range("B{SECTEUR}").Value) & " / " & _
            modOutil.Txt(Sh.Range("B{PHASE}").Value) & " -> note approuvée " & Sh.Range("B6").Text
    End If
Fin:
End Sub
'''
